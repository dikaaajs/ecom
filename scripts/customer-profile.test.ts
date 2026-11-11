import assert from "node:assert/strict";
import { test } from "node:test";
import { profileInput,addressInput,emailChangeInput } from "../lib/account/profile";
import { storefrontAccountLink } from "../lib/account/navigation";
test("storefront account navigation never links to the admin dashboard",()=>{
  for(const role of [undefined,"admin","revoked","unknown"])assert.deepEqual(storefrontAccountLink(role),{href:"/account/login",label:"Masuk / Daftar"});
  assert.deepEqual(storefrontAccountLink("customer"),{href:"/account/profile",label:"Profil saya"});
});
test("profile updates accept contact info and reject account ownership/email changes",()=>{
  assert.equal(profileInput.safeParse({name:"Pembeli",phone:"+62 81234567890"}).success,true);
  assert.equal(profileInput.safeParse({name:"Pembeli",phone:""}).success,true);
  for(const field of ["email","customerId","role","sessionVersion","avatarPath"])assert.equal(profileInput.safeParse({name:"Pembeli",phone:"",[field]:"injected"}).success,false);
  assert.equal(profileInput.safeParse({name:"x",phone:"invalid"}).success,false);
});
test("addresses require Indonesian postal/contact formats and cannot assign another owner",()=>{
  const address={label:"Rumah",recipient:"Pembeli",phone:"081234567890",addressLine:"Jalan Contoh nomor 10",province:"Jawa Barat",city:"Bandung",district:"Coblong",postalCode:"40132",isDefault:true};
  assert.equal(addressInput.safeParse(address).success,true);
  assert.equal(addressInput.safeParse({...address,customerId:"someone-else"}).success,false);
  assert.equal(addressInput.safeParse({...address,postalCode:"123"}).success,false);
  assert.equal(addressInput.safeParse({...address,phone:"hello"}).success,false);
});
test("email changes normalize the new address and require current password",()=>{
  const result=emailChangeInput.parse({email:"  Buyer@Example.com  ",password:"current-password"});
  assert.equal(result.email,"buyer@example.com");
  assert.equal(emailChangeInput.safeParse({email:"buyer@example.com",password:""}).success,false);
  assert.equal(emailChangeInput.safeParse({email:"invalid",password:"password"}).success,false);
});

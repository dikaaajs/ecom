// Opt-in integration test. Creates only disposable buyer fixtures, then removes them.
require('@next/env').loadEnvConfig(process.cwd());
const assert=require('node:assert/strict');
const {randomUUID,randomBytes,createHash}=require('node:crypto');
const fs=require('node:fs');
const {PrismaClient}=require('@prisma/client');
const {encode}=require('next-auth/jwt');
const bcrypt=require('bcryptjs');
const {createClient}=require('@supabase/supabase-js');
if(process.env.CONFIRM_PROFILE_TEST!=='yes')throw Error('Set CONFIRM_PROFILE_TEST=yes to run disposable customer integration tests');
const db=new PrismaClient({datasourceUrl:process.env.DIRECT_URL||process.env.DATABASE_URL});
const base=process.env.PROFILE_TEST_URL||'http://127.0.0.1:3108';
const ids=[];
const hash=value=>createHash('sha256').update(value).digest('hex');
const body=(method,data)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
async function cookie(customer,version=0,role='customer') {
  const token=await encode({secret:process.env.NEXTAUTH_SECRET,token:{sub:customer,role,sessionVersion:version}});
  return 'next-auth.session-token='+token+'; __Secure-next-auth.session-token='+token;
}
async function api(path,auth,options={}) {
  const response=await fetch(base+path,{...options,redirect:'manual',headers:{...options.headers,...(auth?{Cookie:auth}:{}),Origin:base}});
  const data=await response.json().catch(()=>({}));
  return {status:response.status,data,headers:response.headers};
}
async function fixture() {
  const email=`profile-test-${randomUUID()}@example.invalid`;
  const row=await db.customer.create({data:{name:'Profile test fixture',email,account:{create:{email,passwordHash:await bcrypt.hash(randomBytes(32).toString('hex'),4),emailVerifiedAt:new Date()}}},include:{account:true}});
  ids.push(row.id);return row;
}
async function token(accountId,purpose,version,targetEmail,expired=false) {
  const raw=randomBytes(32).toString('hex');
  const row=await db.accountActionToken.create({data:{accountId,purpose,tokenHash:hash(raw),sessionVersion:version,targetEmail,expiresAt:new Date(Date.now()+(expired?-1000:30*60000))}});
  return {raw,id:row.id};
}
(async()=>{
  const a=await fixture(),b=await fixture(),auth=await cookie(a.id),other=await cookie(b.id),admin=await cookie('profile-admin-test',0,'admin');
  assert.equal((await api('/api/account/profile',null)).status,401);
  assert.equal((await api('/api/account/profile',admin)).status,401);
  const first=await api('/api/account/profile',auth);assert.equal(first.status,200);assert.equal(first.headers.get('cache-control'),'private, no-store');
  for(const field of ['passwordHash','avatarPath','sessionVersion','tokenHash'])assert.ok(!JSON.stringify(first.data).includes(field));
  assert.equal((await api('/api/account/profile',auth,body('PATCH',{name:'Updated buyer fixture',phone:'081234567890'}))).status,200);
  assert.equal((await api('/api/account/profile',auth)).data.profile.name,'Updated buyer fixture');
  assert.equal((await api('/api/account/profile',other)).data.profile.name,'Profile test fixture');
  assert.equal((await api('/api/account/profile',auth,body('PATCH',{name:'Invalid',phone:'',email:'not-allowed@example.invalid'}))).status,422);
  const contact={label:'Fixture address',recipient:'Fixture recipient',phone:'081234567890',addressLine:'Jalan Pengujian nomor 10',province:'Jawa Barat',city:'Bandung',district:'Coblong',postalCode:'40132',isDefault:true};
  assert.equal((await api('/api/account/addresses',auth,body('POST',{...contact,customerId:b.id}))).status,422);
  assert.equal((await api('/api/account/addresses',auth,body('POST',contact))).status,201);
  let book=(await api('/api/account/profile',auth)).data.addresses;
  const address=book[0];assert.equal(address.isDefault,true);
  assert.equal((await api(`/api/account/addresses/${address.id}`,other,body('PATCH',contact))).status,404);
  assert.equal((await api(`/api/account/addresses/${address.id}`,other,{method:'DELETE'})).status,404);
  const concurrent=await Promise.all([1,2].map(n=>api('/api/account/addresses',auth,body('POST',{...contact,label:`Concurrent ${n}`}))));
  concurrent.forEach(r=>assert.equal(r.status,201));
  book=(await api('/api/account/profile',auth)).data.addresses;assert.equal(book.length,3);assert.equal(book.filter(a=>a.isDefault).length,1);
  const primary=book.find(a=>a.isDefault);assert.equal((await api(`/api/account/addresses/${primary.id}`,auth,{method:'DELETE'})).status,200);
  book=(await api('/api/account/profile',auth)).data.addresses;assert.equal(book.length,2);assert.equal(book.filter(a=>a.isDefault).length,1);
  console.log('PASS: profile persistence, private response, guest/admin rejection, address ownership, concurrent defaults and primary promotion');

  const mailConfigured=process.env.RESEND_API_KEY&&process.env.ACCOUNT_EMAIL_FROM&&(process.env.ACCOUNT_APP_URL||process.env.NEXTAUTH_URL);
  assert.equal((await api('/api/account/change-email',auth,body('POST',{email:`new-${randomUUID()}@example.invalid`,password:'wrong-password'}))).status,mailConfigured?422:503);
  const newEmail=`changed-${randomUUID()}@example.invalid`;
  const change=await token(a.account.id,'CHANGE_EMAIL',0,newEmail);
  const oldReset=await token(a.account.id,'RESET_PASSWORD',null,null);
  assert.equal((await api('/api/account/verify',null,body('POST',{token:change.raw}))).status,200);
  assert.equal((await api('/api/account/verify',null,body('POST',{token:change.raw}))).status,400);
  assert.equal((await api('/api/account/profile',auth)).status,401);
  const fresh=await cookie(a.id,1);
  assert.equal((await api('/api/account/profile',fresh)).data.profile.email,newEmail);
  assert.equal((await db.customer.findUnique({where:{id:a.id}})).email,newEmail);
  assert.ok((await db.accountActionToken.findUnique({where:{id:oldReset.id}})).consumedAt);
  const pending=await token(a.account.id,'CHANGE_EMAIL',1,`stale-${randomUUID()}@example.invalid`);
  const reset=await token(a.account.id,'RESET_PASSWORD',null,null);
  const resetResponse=await api('/api/account/reset-password',null,body('POST',{token:reset.raw,password:'Fixture reset password 12345'}));
  assert.equal(resetResponse.status,200);
  assert.equal((await api('/api/account/verify',null,body('POST',{token:pending.raw}))).status,400);
  assert.equal((await api('/api/account/profile',fresh)).status,401);
  const current=await cookie(a.id,2);
  const conflict=await token(a.account.id,'CHANGE_EMAIL',2,b.email);
  assert.equal((await api('/api/account/verify',null,body('POST',{token:conflict.raw}))).status,400);
  assert.equal((await api('/api/account/profile',current)).data.profile.email,newEmail);
  assert.equal((await db.accountActionToken.findUnique({where:{id:conflict.id}})).consumedAt,null);
  const expired=await token(a.account.id,'CHANGE_EMAIL',2,`expired-${randomUUID()}@example.invalid`,true);
  assert.equal((await api('/api/account/verify',null,body('POST',{token:expired.raw}))).status,400);
  console.log('PASS: verified email replacement, replay/expiry/conflict rejection, reset-token invalidation and session revocation; no email sent');

  const image=new FormData();image.append('file',new Blob([fs.readFileSync('public/logoo.png')],{type:'image/png'}),'fixture.png');
  const upload=await api('/api/account/avatar',current,{method:'POST',body:image});assert.equal(upload.status,200,upload.data.error);
  const photo=(await api('/api/account/profile',current)).data.profile;assert.equal(photo.hasAvatar,true);assert.ok(photo.avatarUrl);assert.equal((await fetch(photo.avatarUrl)).status,200);
  assert.equal((await api('/api/account/profile',other)).data.profile.hasAvatar,false);
  const storage=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal((await storage.storage.getBucket('customer-avatars')).data.public,false);
  assert.equal((await api('/api/account/avatar',current,{method:'DELETE'})).status,200);
  assert.equal((await api('/api/account/profile',current)).data.profile.hasAvatar,false);
  console.log('PASS: private avatar upload, owner-only signed photo, private bucket and photo removal');
})().catch(error=>{console.error('Profile integration failed:',error.message);process.exitCode=1;}).finally(async()=>{
  for(const id of ids){
    const row=await db.customer.findUnique({where:{id},select:{avatarPath:true}});
    if(row?.avatarPath&&process.env.SUPABASE_SERVICE_ROLE_KEY){const storage=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);await storage.storage.from('customer-avatars').remove([row.avatarPath]);}
  }
  if(ids.length){await db.customer.deleteMany({where:{id:{in:ids}}});await db.authRateLimit.deleteMany({where:{key:{in:ids.flatMap(id=>['avatar-account:','change-email-account:'].map(scope=>scope+hash(id.toLowerCase())))}}});}
  await db.$disconnect();console.log('Disposable profile fixtures removed');
});

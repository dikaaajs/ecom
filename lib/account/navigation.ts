export function storefrontAccountLink(role?: string) {
  return role==="customer" ? {href:"/account/profile",label:"Profil saya"} : {href:"/account/login",label:"Masuk / Daftar"};
}

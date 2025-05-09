const a=async()=>await(await fetch("/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}})).json();export{a as load};

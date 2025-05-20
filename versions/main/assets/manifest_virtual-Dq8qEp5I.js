const a=async()=>{let a=await fetch("/ember-native/versions/main/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}});return await a.json()};export{a as load};

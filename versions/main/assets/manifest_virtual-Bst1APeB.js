const t=async()=>{let t=await fetch("/ember-native/test-sub/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}});return await t.json()};export{t as load};

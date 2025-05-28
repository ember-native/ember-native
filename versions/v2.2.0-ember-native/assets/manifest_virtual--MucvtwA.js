const e=async()=>{let e=await fetch("/ember-native/versions/v2.2.0-ember-native/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}});return await e.json()};export{e as load};

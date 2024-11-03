const a=async()=>await(await fetch("/ember-nativekolay-manifest/manifest.json",{headers:{Accept:"application/json"}})).json();export{a as load};

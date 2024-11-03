const a=async()=>await(await fetch("/ember-native/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}})).json();export{a as load};

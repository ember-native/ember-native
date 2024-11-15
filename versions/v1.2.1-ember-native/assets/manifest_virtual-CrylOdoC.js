const a=async()=>await(await fetch("/ember-native/versions/v1.2.1-ember-native/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}})).json();export{a as load};

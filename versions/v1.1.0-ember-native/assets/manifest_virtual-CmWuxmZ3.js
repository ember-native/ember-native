const a=async()=>await(await fetch("/ember-native/versions/v1.1.0-ember-native/kolay-manifest/manifest.json",{headers:{Accept:"application/json"}})).json();export{a as load};

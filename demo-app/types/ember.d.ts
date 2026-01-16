import 'ember-source/types';
import 'ember-native/types/glint'

// Re-export WarpDrive symbols with the expected path
declare module '@warp-drive/core-types/symbols' {
  export { Type, ResourceType, TransformName, RequestSignature } from '@warp-drive/core/types/symbols';
}
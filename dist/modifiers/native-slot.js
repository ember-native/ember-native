
import { modifier } from 'ember-modifier';

var nativeSlot = modifier((element, [propertyName]) => {
  const nativeElement = element.nativeView;
  const parentElement = element.parentNode?.nativeView;
  if (parentElement && nativeElement) {
    // Set the child on the parent's property
    parentElement[propertyName] = nativeElement;
  }
  return () => {
    // Cleanup: remove the reference
    if (parentElement) {
      parentElement[propertyName] = null;
    }
  };
});

export { nativeSlot as default };
//# sourceMappingURL=native-slot.js.map

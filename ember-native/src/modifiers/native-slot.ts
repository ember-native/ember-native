import { modifier } from 'ember-modifier';

interface NativeSlotSignature {
  Element: Element;
  Args: {
    Positional: [propertyName: string];
  };
}

export default modifier<NativeSlotSignature>(
  (element, [propertyName]) => {
    const nativeElement = (element as any).nativeView;
    const parentElement = (element.parentNode as any)?.nativeView;

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
  }
);

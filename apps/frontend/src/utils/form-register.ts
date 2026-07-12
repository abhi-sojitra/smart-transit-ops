import type { ChangeEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type TransformFn = (value: string) => string;

interface RegisterEnhanceOptions {
  transform?: TransformFn;
  onBlurTransform?: TransformFn;
}

/** Merge react-hook-form register with live input transforms. */
export function enhanceRegister<TFieldName extends string>(
  registerReturn: UseFormRegisterReturn<TFieldName>,
  options: RegisterEnhanceOptions = {},
) {
  const { onChange, onBlur, ...rest } = registerReturn;

  return {
    ...rest,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (options.transform) {
        event.target.value = options.transform(event.target.value);
      }
      onChange(event);
    },
    onBlur: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (options.onBlurTransform) {
        event.target.value = options.onBlurTransform(event.target.value);
      }
      onBlur(event);
    },
  };
}

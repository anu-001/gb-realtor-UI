import type { FieldValues, Control, Path, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { RichTextEditor, type RichTextEditorProps } from "./RichTextEditor";

type RichTextEditorFieldProps<TFieldValues extends FieldValues> = Omit<
  RichTextEditorProps,
  "value" | "onChange" | "error"
> & {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
};

export function RichTextEditorField<TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  ...editorProps
}: RichTextEditorFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <RichTextEditor
          {...editorProps}
          value={(field.value as string) ?? ""}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

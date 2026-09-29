export function findMissingRequiredField(fields, values) {
  return fields.find((field) => {
    if (!field.required) return false;
    const value = values[field.name];
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  });
}

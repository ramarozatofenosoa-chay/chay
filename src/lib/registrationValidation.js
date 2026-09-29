export function canSubmitRegistration({
  firstName,
  lastName,
  gender,
  emailValid,
  phoneValid,
  country,
  city,
  passwordValid,
  passwordMatch,
  respectConsent,
  acceptCgu,
  loading,
}) {
  return (
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    Boolean(gender) &&
    emailValid &&
    phoneValid &&
    Boolean(country) &&
    city.trim().length > 0 &&
    passwordValid &&
    passwordMatch &&
    respectConsent &&
    acceptCgu &&
    !loading
  );
}

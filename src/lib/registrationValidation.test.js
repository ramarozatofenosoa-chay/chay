import test from "node:test";
import assert from "node:assert/strict";
import { canSubmitRegistration } from "./registrationValidation.js";

const validDetails = {
  firstName: "Aina",
  lastName: "Rakoto",
  gender: "Femme",
  emailValid: true,
  phoneValid: true,
  country: "Madagascar",
  city: "Antananarivo",
  passwordValid: true,
  passwordMatch: true,
  respectConsent: true,
  acceptCgu: true,
  loading: false,
};

test("location and cookie choices are not required to create an account", () => {
  assert.equal(
    canSubmitRegistration({
      ...validDetails,
      locationGranted: false,
      acceptCookies: false,
    }),
    true
  );
});

test("required terms and account fields still gate registration", () => {
  assert.equal(
    canSubmitRegistration({ ...validDetails, acceptCgu: false }),
    false
  );
  assert.equal(
    canSubmitRegistration({ ...validDetails, emailValid: false }),
    false
  );
});

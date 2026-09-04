const { initializeAuth, signInWithPhoneNumber } = require('firebase/auth');
const app = require('firebase/app').initializeApp({ apiKey: "test", appId: "test", projectId: "test" });
const auth = initializeAuth(app);
class FakeVerifier {
  constructor() {
    this.type = 'recaptcha';
  }
  async verify() {
    return 'token';
  }
}
async function test() {
  try {
    await signInWithPhoneNumber(auth, "+11234567890", new FakeVerifier());
  } catch (e) {
    console.error(e);
  }
}
test();

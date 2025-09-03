// Test script for business registration
const testData = {
  email: "testbusiness@example.com",
  password: "TestPassword123",
  displayName: "Test Business Owner",
  phone: "+1234567890",
  nationalId: "TEST123456",
  role: "business",
  businessName: "Test Business",
  businessType: "Retail",
  businessDescription: "A test business for testing purposes",
  businessPhone: "+1234567890",
  businessWebsite: "",
  latitude: -17.8252,
  longitude: 31.0335,
  address: "123 Test St, Test City, Test Country"
};

console.log("Test data:", testData);
console.log("JSON stringified:", JSON.stringify(testData));

// Test if the data can be parsed back
try {
  const parsed = JSON.parse(JSON.stringify(testData));
  console.log("Successfully parsed back:", parsed);
} catch (error) {
  console.error("Error parsing back:", error);
}

// Test the schema validation
const { schema } = require('./endpoints/auth/register_business_POST.schema.ts');
try {
  const validated = schema.parse(testData);
  console.log("Schema validation successful:", validated);
} catch (error) {
  console.error("Schema validation failed:", error);
}






import { z } from "zod";
import { User } from "../../helpers/User";

export const schema = z.object({
  // User registration fields
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required").regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"),
  nationalId: z.string().min(1, "National ID is required").min(5, "National ID must be at least 5 characters"),
  role: z.literal("business"),
  
  // Business-specific fields
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessDescription: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone is required"),
  businessWebsite: z.string().url().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, "Address is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
  business: {
    id: number;
    businessName: string;
    status: string;
  };
};

export const postRegisterBusiness = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  console.log("Sending request to server:", validatedInput);
  
  const result = await fetch(`/_api/auth/register_business`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  console.log("Response status:", result.status);
  console.log("Response headers:", Object.fromEntries(result.headers.entries()));

  if (!result.ok) {
    const responseText = await result.text();
    console.log("Error response text:", responseText);
    
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse error response:", parseError);
      throw new Error(`Server error: ${result.status} ${result.statusText}`);
    }
    
    throw new Error(errorData.message || "Business registration failed");
  }

  const responseText = await result.text();
  console.log("Success response text:", responseText);
  
  try {
    const responseData = JSON.parse(responseText);
    console.log("Parsed response data:", responseData);
    return responseData;
  } catch (parseError) {
    console.error("Failed to parse success response:", parseError);
    throw new Error("Invalid response format from server");
  }
};
import React, { useState } from "react";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { MapPin, ArrowLeft } from "lucide-react";
import { LocationPicker } from "./LocationPicker";
import styles from "./BusinessRegisterForm.module.css";
import { useAuth } from "../helpers/useAuth";
import {
  schema,
  postRegister,
} from "../endpoints/auth/register_with_password_POST.schema";
import { User } from "../helpers/User";

// Extended schema for business registration
const businessSchema = schema.extend({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessDescription: z.string().optional(),
  businessPhone: z.string().min(1, "Business phone is required"),
  businessWebsite: z.string().url().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, "Address is required"),
});

export type BusinessRegisterFormData = z.infer<typeof businessSchema>;

interface BusinessRegisterFormProps {
  onBack: () => void;
  onRegisterSuccess?: (user: User) => void;
}

export const BusinessRegisterForm: React.FC<BusinessRegisterFormProps> = ({
  onBack,
  onRegisterSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPosition, setMapPosition] = useState({ lat: -17.8252, lng: 31.0335 }); // Default to Harare
  const { onLogin } = useAuth();

  const form = useForm({
    schema: businessSchema,
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      phone: "",
      nationalId: "",
      role: "business" as const,
      businessName: "",
      businessType: "",
      businessDescription: "",
      businessPhone: "",
      businessWebsite: "",
      latitude: -17.8252,
      longitude: 31.0335,
      address: "",
    },
  });

  const handleSubmit = async (data: BusinessRegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      // Prepare data for registration (remove business-specific fields)
      const registrationData = {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phone: data.phone,
        nationalId: data.nationalId,
        role: data.role,
      };

      const result = await postRegister(registrationData);
      console.log("Business registration successful for:", data.email);
      onLogin(result.user);
      if (onRegisterSuccess) {
        onRegisterSuccess(result.user);
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes("email already in use")) {
          setError(
            "This email is already registered. Please try logging in instead."
          );
        } else if (errorMessage.includes("national ID already in use")) {
          setError(
            "This national ID is already registered. Please use a different ID or contact support."
          );
        } else {
          setError(errorMessage || "Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMapPosition({ lat, lng });
    form.setValues((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Role Selection
        </button>
        <h1 className={styles.title}>Register Your Business</h1>
        <p className={styles.subtitle}>
          Create your business account and set up your location
        </p>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={styles.form}
        >
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            
            <FormItem name="displayName">
              <FormLabel>Your Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  value={form.values.displayName || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="email">
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="your@email.com"
                  type="email"
                  value={form.values.email || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="phone">
              <FormLabel>Personal Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={form.values.phone || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="nationalId">
              <FormLabel>National ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="SSN, Driver's License, Passport, etc."
                  value={form.values.nationalId || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      nationalId: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormDescription>
                Enter your SSN, driver's license, passport number, or other government-issued ID
              </FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="password">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.values.password || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormDescription>
                At least 8 characters with uppercase, lowercase, and number
              </FormDescription>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Business Information</h2>
            
            <FormItem name="businessName">
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your Business Name"
                  value={form.values.businessName || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="businessType">
              <FormLabel>Business Type</FormLabel>
              <FormControl>
                <Input
                  placeholder="Restaurant, Retail, Service, etc."
                  value={form.values.businessType || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      businessType: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="businessDescription">
              <FormLabel>Business Description</FormLabel>
              <FormControl>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe your business..."
                  value={form.values.businessDescription || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      businessDescription: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="businessPhone">
              <FormLabel>Business Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={form.values.businessPhone || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      businessPhone: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="businessWebsite">
              <FormLabel>Business Website (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://yourbusiness.com"
                  value={form.values.businessWebsite || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      businessWebsite: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <MapPin size={20} />
              Business Location
            </h2>
            
            <FormItem name="address">
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Business St, City, State, ZIP"
                  value={form.values.address || ""}
                  onChange={(e) =>
                    form.setValues((prev: any) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormDescription>
                Enter your business address
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div className={styles.mapContainer}>
              <LocationPicker
                latitude={mapPosition.lat}
                longitude={mapPosition.lng}
                onLocationChange={(lat, lng) => {
                  setMapPosition({ lat, lng });
                  form.setValues((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }));
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" /> Creating Business Account...
              </>
            ) : (
              "Create Business Account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

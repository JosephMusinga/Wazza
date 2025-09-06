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
import { ArrowLeft } from "lucide-react";
import styles from "./UserRegisterForm.module.css";
import { useAuth } from "../helpers/useAuth";
import {
  schema,
  postRegister,
} from "../endpoints/auth/register_with_password_POST.schema";
import { User } from "../helpers/User";

export type UserRegisterFormData = z.infer<typeof schema>;

interface UserRegisterFormProps {
  onBack: () => void;
  onRegisterSuccess?: (user: User) => void;
}

export const UserRegisterForm: React.FC<UserRegisterFormProps> = ({
  onBack,
  onRegisterSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed onLogin - we don't want to auto-login after registration

  const form = useForm({
    schema,
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      phone: "",
      nationalId: "",
      role: "user" as const,
    },
  });

  const handleSubmit = async (data: UserRegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await postRegister(data);
      console.log("User registration successful for:", data.email);
      
      // Don't call onLogin here - let the redirect happen via onRegisterSuccess
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
        } else if (errorMessage.toLowerCase().includes("display name")) {
          setError("Please provide a valid display name that isn't empty.");
        } else if (errorMessage.toLowerCase().includes("phone")) {
          setError("Please provide a valid phone number.");
        } else if (errorMessage.toLowerCase().includes("national id")) {
          setError("Please provide a valid national ID.");
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Role Selection
        </button>
        <h1 className={styles.title}>Register as Agent Buyer</h1>
        <p className={styles.subtitle}>
          Create your account to shop on behalf of regular people and send gifts
        </p>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={styles.form}
        >
          <FormItem name="displayName">
            <FormLabel>Full Name</FormLabel>
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
            <FormLabel>Phone Number</FormLabel>
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

          <Button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};


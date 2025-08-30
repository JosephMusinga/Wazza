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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import styles from "./PasswordRegisterForm.module.css";
import { useAuth } from "../helpers/useAuth";
import {
  schema,
  postRegister,
} from "../endpoints/auth/register_with_password_POST.schema";
import { User } from "../helpers/User";
import { UserRoleArrayValues } from "../helpers/schema";

export type RegisterFormData = z.infer<typeof schema>;

interface PasswordRegisterFormProps {
  className?: string;
  defaultValues?: Partial<RegisterFormData>;
  onRegisterSuccess?: (user: User) => void;
}

export const PasswordRegisterForm: React.FC<PasswordRegisterFormProps> = ({
  className,
  defaultValues,
  onRegisterSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuth();

  const form = useForm({
    schema,
    defaultValues: defaultValues || {
      email: "",
      password: "",
      displayName: "",
      phone: "",
      nationalId: "",
      role: "user",
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await postRegister(data);
      console.log("Registration successful for:", data.email);
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
        console.log("Unknown error type:", err);
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form
        onSubmit={form.handleSubmit((data) =>
          handleSubmit(data as z.infer<typeof schema>)
        )}
        className={`${styles.form} ${className || ""}`}
      >
        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              placeholder="your@email.com"
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

        <FormItem name="displayName">
          <FormLabel>Display Name</FormLabel>
          <FormControl>
            <Input
              id="register-display-name"
              placeholder="Your Name"
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

        <FormItem name="phone">
          <FormLabel>Phone Number</FormLabel>
          <FormControl>
            <Input
              id="register-phone"
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
              id="register-national-id"
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

        <FormItem name="role">
          <FormLabel>I am a...</FormLabel>
          <Select
            value={form.values.role}
            onValueChange={(value) =>
              form.setValues((prev) => ({ ...prev, role: value as z.infer<typeof schema>['role'] }))
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {UserRoleArrayValues.map((role) => (
                <SelectItem key={role} value={role}>
                  <span style={{ textTransform: "capitalize" }}>
                    {role === "business" ? "Business Owner" : role}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  );
};
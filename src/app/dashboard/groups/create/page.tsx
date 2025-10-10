"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import PostalCodeAutocomplete from "@/components/ui/PostalCodeAutocomplete";
import { supabase } from "@/lib/supabase";
import { getAllCountries, getCountryByCode, Country } from "@/lib/countryService";
import { PostalCode } from "@/lib/postalCodeService";

export interface GroupFormData {
  name: string;
  description: string;
  city: string;
  country: string;
  country_code: string;
  postal_code: string;
  place_name: string;
  group_type: string;
}

export default function CreateGroupPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
    city: "",
    country: "",
    country_code: "",
    postal_code: "",
    place_name: "",
    group_type: "private",
  });

  // Cargar países disponibles
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await getAllCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error("Error cargando países:", error);
      }
    };

    loadCountries();
  }, []);

  // Preseleccionar el país del usuario si está disponible en su perfil
  useEffect(() => {
    const loadUserCountry = async () => {
      if (profile && profile.country_code && formData.country_code === "") {
        try {
          let countryName = profile.country || "";
          
          // Si tenemos country_code pero no country, buscar el nombre del país
          if (profile.country_code && !profile.country) {
            const countryData = await getCountryByCode(profile.country_code);
            countryName = countryData?.country_name || "";
          }

          setFormData(prev => ({
            ...prev,
            country: countryName,
            country_code: profile.country_code || "",
          }));
        } catch (error) {
          console.error("Error cargando país del usuario:", error);
        }
      }
    };

    loadUserCountry();
  }, [profile, formData.country_code]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del grupo es requerido";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = "El código postal es requerido";
    }

    if (!formData.country_code.trim()) {
      newErrors.country = "El país es requerido";
    }

    if (!isLocationConfirmed) {
      newErrors.postal_code = "Debes seleccionar un código postal válido de la lista";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: formData.name,
          description: formData.description,
          postal_code: formData.postal_code || null,
          place_name: formData.place_name || null,
          city: formData.city,
          country: formData.country,
          country_code: formData.country_code,
          group_type: formData.group_type,
          creator_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Redirect to groups page
      router.push("/dashboard/groups?tab=my-groups");
    } catch (error) {
      console.error("Error creating group:", error);
      setErrors({ submit: "Error al crear el grupo. Inténtalo de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostalCodeSelect = async (location: PostalCode | null) => {
    if (location) {
      // Ubicación válida seleccionada
      // Mapear correctamente los campos de la API
      const city = location.admin_name1 || location.admin_name2 || location.admin_name3 || location.place_name;
      
      // Obtener el nombre del país usando el código
      let countryName = "";
      if (location.country_code) {
        try {
          const countryData = await getCountryByCode(location.country_code);
          countryName = countryData?.country_name || "";
        } catch (error) {
          console.error("Error obteniendo nombre del país:", error);
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        postal_code: location.postal_code || "",
        city: city || "",
        place_name: location.place_name || "",
        country: countryName || prev.country,
        country_code: location.country_code || prev.country_code,
      }));
      setIsLocationConfirmed(true);
      // Limpiar error de código postal si existe
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.postal_code;
        return newErrors;
      });
    } else {
      // Se está escribiendo o se limpió la selección
      setIsLocationConfirmed(false);
      setFormData((prev) => ({
        ...prev,
        postal_code: "",
        city: "",
        place_name: "",
        // Mantener country y country_code
      }));
    }
  };

  // Función para limpiar código postal (no utilizada actualmente)
  // const handlePostalCodeClear = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     postal_code: "",
  //     city: "",
  //     place_name: "",
  //     // Mantener country y country_code
  //   }));
  //   setIsLocationConfirmed(false);
  // };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-text-secondary hover:text-text-main transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-text-main font-montserrat">
                  Crear Nuevo Grupo
                </h1>
                <p className="text-text-secondary font-open-sans mt-2">
                  Completa la información para crear tu grupo de padel
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-bg-main rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2 font-open-sans">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
                  placeholder="Ej: Padel Nocturno"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 font-open-sans">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2 font-open-sans">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans resize-none"
                  placeholder="Describe tu grupo de padel..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 font-open-sans">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2 font-open-sans">
                    País *
                  </label>
                  <select
                    value={formData.country_code}
                    onChange={(e) => {
                      const selectedOption = e.target.selectedOptions[0];
                      setFormData((prev) => ({
                        ...prev,
                        country_code: e.target.value,
                        country: selectedOption.dataset.country || "",
                      }));
                    }}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
                  >
                    <option value="">Selecciona un país</option>
                    {countries.map((country) => (
                      <option
                        key={country.id}
                        value={country.country_code}
                        data-country={country.country_name}
                      >
                        {country.flag_emoji ? `${country.flag_emoji} ` : ""}
                        {country.country_name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1 font-open-sans">
                      {errors.country}
                    </p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2 font-open-sans">
                    Código Postal *
                  </label>
                  <PostalCodeAutocomplete
                    countryCode={formData.country_code}
                    value={formData.postal_code}
                    onChange={handlePostalCodeSelect}
                    placeholder="Buscar código postal..."
                    showCountrySelector={false}
                  />
                  {errors.postal_code && (
                    <p className="text-red-500 text-sm mt-1 font-open-sans">{errors.postal_code}</p>
                  )}
                  {formData.city && isLocationConfirmed && (
                    <div className="bg-bg-secondary border border-accent-primary/20 rounded-lg p-4 mt-3 shadow-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
                          <span className="text-accent-primary text-lg">✓</span>
                        </div>
                        <h4 className="text-accent-primary font-montserrat font-semibold text-sm">
                          Ubicación Confirmada
                        </h4>
                      </div>
                      <div className="space-y-2 ml-11">
                        <div className="flex items-center text-sm">
                          <span className="text-accent-primary mr-2">📍</span>
                          <span className="text-text-secondary font-open-sans">Ciudad:</span>
                          <span className="text-text-main font-open-sans font-medium ml-2">{formData.city}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-accent-primary mr-2">📮</span>
                          <span className="text-text-secondary font-open-sans">Código Postal:</span>
                          <span className="text-text-main font-open-sans font-medium ml-2">{formData.postal_code}</span>
                        </div>
                        {formData.place_name && (
                          <div className="flex items-center text-sm">
                            <span className="text-accent-primary mr-2">🏷️</span>
                            <span className="text-text-secondary font-open-sans">Lugar:</span>
                            <span className="text-text-main font-open-sans font-medium ml-2">{formData.place_name}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <span className="text-accent-primary mr-2">🌍</span>
                          <span className="text-text-secondary font-open-sans">País:</span>
                          <span className="text-text-main font-open-sans font-medium ml-2">{formData.country}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.city && !isLocationConfirmed && (
                    <p className="text-sm text-yellow-600 mt-1 font-open-sans flex items-center">
                      <span className="mr-1">⚠️</span>
                      Selecciona una opción de la lista para confirmar
                    </p>
                  )}
                </div>
              </div>

              {/* Group Type */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2 font-open-sans">
                  Tipo de Grupo
                </label>
                <select
                  value={formData.group_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      group_type: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
                >
                  <option value="private">Privado (solo por invitación)</option>
                  <option value="public">
                    Público (cualquiera puede unirse)
                  </option>
                </select>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-500 text-sm font-open-sans">
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-bg-secondary text-text-main border border-border rounded-lg font-medium hover:bg-bg-secondary/80 hover:border-accent-primary/50 transition-colors font-open-sans cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-accent-primary text-bg-main rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-open-sans cursor-pointer"
                >
                  {isSubmitting ? "Creando..." : "Crear Grupo"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

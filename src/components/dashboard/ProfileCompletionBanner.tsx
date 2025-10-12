"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface ProfileCompletionBannerProps {
  className?: string;
}

export default function ProfileCompletionBanner({
  className = "",
}: ProfileCompletionBannerProps) {
  const { profile } = useAuth();

  // Verificar qué campos están incompletos
  const isProfileIncomplete = () => {
    if (!profile) return true
    
    // Verificar ubicación usando los nuevos campos
    const hasLocation = profile.place_name || profile.city
    
    const requiredFields = [
      profile.phone,
      profile.skill_level !== null && profile.skill_level !== undefined && profile.skill_level > 1, // skill_level debe ser mayor a 1 (no beginner)
      profile.preferred_position, // cualquier posición es válida
      hasLocation,
    ];

    return requiredFields.some((field) => !field);
  };

  const getMissingFields = () => {
    if (!profile) return ["Información básica"];

    const missing = [];
    if (!profile.phone) missing.push("Teléfono");
    if (!profile.skill_level || profile.skill_level === 1)
      missing.push("Nivel de juego");
    if (!profile.preferred_position) missing.push('Posición preferida')
    
    // Verificar ubicación usando los nuevos campos
    const hasLocation = profile.place_name || profile.city
    if (!hasLocation) missing.push('Ubicación')
    
    return missing;
  };

  // No mostrar el banner si el perfil está completo
  if (!isProfileIncomplete()) {
    return null;
  }

  const missingFields = getMissingFields();

  return (
    <div
      data-profile-banner
      className={`bg-gradient-to-br from-accent-primary/5 via-accent-primary/10 to-accent-primary/5 border border-accent-primary/20 rounded-xl p-3 sm:p-6 mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      <div className="flex items-start space-x-3 sm:space-x-0">
        <div className="flex-shrink-0">
          <div className="bg-accent-primary/10 p-2 sm:p-3 rounded-xl">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-accent-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
        <div className="sm:ml-5 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-text-main font-montserrat">
              ¡Completa tu perfil de jugador!
            </h3>
            <div className="bg-accent-primary/20 text-accent-primary text-xs font-semibold px-2 py-1 rounded-full self-start sm:self-auto">
              🏆 MEJORA TU EXPERIENCIA
            </div>
          </div>
          <p className="text-sm sm:text-base text-text-secondary font-open-sans mb-3 sm:mb-4 leading-relaxed">
            Completa tu información para conectar con jugadores de tu nivel y
            encontrar los mejores grupos de pádel cerca de ti.
          </p>

          <div className="bg-bg-main/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 border border-accent-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-4 w-4 text-accent-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-xs sm:text-sm font-semibold text-text-main font-open-sans">
                Información pendiente:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary font-open-sans"
                >
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full flex-shrink-0"></div>
                  <span className="truncate">{field}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            <Link
              href="/dashboard/profile?tab=profile"
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-accent-primary text-bg-main text-sm font-semibold rounded-lg hover:bg-accent-primary/90 transition-all duration-200 shadow-sm hover:shadow-md font-open-sans"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Completar Perfil Ahora
            </Link>
            <button
              onClick={() => {
                // Ocultar temporalmente el banner usando localStorage
                localStorage.setItem("profile-banner-dismissed", "true");
                const banner = document.querySelector("[data-profile-banner]");
                if (banner) {
                  banner.classList.add("hidden");
                }
              }}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-bg-main text-text-secondary text-sm font-medium rounded-lg border border-border hover:bg-bg-secondary hover:text-text-main transition-all duration-200 font-open-sans"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recordar más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

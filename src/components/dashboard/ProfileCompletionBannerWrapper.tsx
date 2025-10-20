"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  skill_level?: number;
  preferred_position?: string;
  place_name?: string;
  city?: string;
}

interface ProfileCompletionBannerWrapperProps {
  className?: string;
}

function isProfileIncomplete(profile: Profile | null): boolean {
  if (!profile) return true;

  const requiredFields = [
    profile.phone,
    profile.skill_level && profile.skill_level > 1, // No es principiante
    profile.preferred_position,
    profile.place_name || profile.city, // Al menos uno de los dos
  ];

  return requiredFields.some((field) => !field);
}

function getMissingFields(profile: Profile | null): string[] {
  if (!profile) return [];

  const missing: string[] = [];

  if (!profile.phone) {
    missing.push("Teléfono");
  }

  if (!profile.skill_level || profile.skill_level <= 1) {
    missing.push("Nivel de habilidad");
  }

  if (!profile.preferred_position) {
    missing.push("Posición preferida");
  }

  if (!profile.place_name && !profile.city) {
    missing.push("Ubicación");
  }

  return missing;
}

export default function ProfileCompletionBannerWrapper({
  className = "",
}: ProfileCompletionBannerWrapperProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile-completion');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setShouldShow(data.shouldShow);
        }
      } catch (error) {
        console.error('Error fetching profile completion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // No mostrar nada mientras carga o si no debe mostrarse
  if (loading || !shouldShow) {
    return null;
  }

  const missingFields = getMissingFields(profile);

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
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0 sm:ml-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-text-main font-montserrat">
                ¡Completa tu perfil para una mejor experiencia!
              </h3>
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-text-secondary">
                  Te faltan algunos datos importantes:
                </p>
                <ul className="mt-1 sm:mt-2 text-xs sm:text-sm text-text-secondary">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-accent-primary rounded-full mr-2 flex-shrink-0"></span>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-accent-primary hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors duration-200"
              >
                Completar perfil
                <svg
                  className="ml-1.5 sm:ml-2 -mr-0.5 h-3 w-3 sm:h-4 sm:w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
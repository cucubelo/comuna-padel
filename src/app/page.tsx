/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      {/* Navigation */}
      <nav className="bg-bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Comuna Padel" className="h-12 w-auto mr-3" />
              <h1 className="text-2xl font-bold text-accent-primary font-montserrat">
                Comuna Padel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth#login"
                className="text-text-secondary hover:text-text-main transition-colors font-open-sans"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth#register"
                className="bg-accent-primary text-bg-main px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-semibold font-open-sans"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-text-main font-montserrat mb-6">
              Conecta con la
              <span className="text-accent-primary"> Comunidad</span>
              <br />
              de Padel
            </h1>
            <p className="text-xl text-text-secondary font-open-sans mb-8 max-w-3xl mx-auto">
              Únete a múltiples grupos, organiza partidos y conecta con
              jugadores de tu nivel. La plataforma definitiva para los amantes
              del padel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth#register"
                className="bg-accent-primary text-bg-main px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-primary/90 transition-colors font-open-sans"
              >
                Comenzar Gratis
              </Link>
              <button className="border border-border text-text-main px-8 py-4 rounded-lg text-lg font-semibold hover:bg-bg-secondary transition-colors font-open-sans">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main font-montserrat mb-4">
              Todo lo que necesitas para jugar padel
            </h2>
            <p className="text-xl text-text-secondary font-open-sans max-w-2xl mx-auto">
              Una plataforma completa diseñada para simplificar la organización
              de partidos y conectar jugadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-accent-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Múltiples Grupos
              </h3>
              <p className="text-text-secondary font-open-sans">
                Únete a varios grupos de padel, cada uno con su propia comunidad
                y estilo de juego
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Organización Fácil
              </h3>
              <p className="text-text-secondary font-open-sans">
                Crea y gestiona partidos con un sistema intuitivo de reservas y
                confirmaciones
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-accent-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Seguimiento de Progreso
              </h3>
              <p className="text-text-secondary font-open-sans">
                Mantén un registro de tus partidos, estadísticas y mejora
                continua
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Encuentra Canchas
              </h3>
              <p className="text-text-secondary font-open-sans">
                Descubre canchas cercanas y reserva directamente desde la
                aplicación
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Niveles de Juego
              </h3>
              <p className="text-text-secondary font-open-sans">
                Conecta con jugadores de tu mismo nivel para partidos más
                equilibrados
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-bg-main rounded-lg p-8 border border-border hover:border-accent-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-accent-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Chat Integrado
              </h3>
              <p className="text-text-secondary font-open-sans">
                Comunícate con tu grupo y coordina partidos en tiempo real
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main font-montserrat mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-text-secondary font-open-sans max-w-2xl mx-auto">
              Comenzar es muy fácil. En solo 3 pasos estarás jugando con tu
              nueva comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-bg-main font-montserrat">
                  1
                </span>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Regístrate
              </h3>
              <p className="text-text-secondary font-open-sans">
                Crea tu perfil indicando tu nivel de juego y posición preferida
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-bg-main font-montserrat">
                  2
                </span>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                Únete a Grupos
              </h3>
              <p className="text-text-secondary font-open-sans">
                Encuentra y únete a grupos de padel en tu zona o crea el tuyo
                propio
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-bg-main font-montserrat">
                  3
                </span>
              </div>
              <h3 className="text-xl font-semibold text-text-main font-montserrat mb-3">
                ¡Juega!
              </h3>
              <p className="text-text-secondary font-open-sans">
                Organiza partidos, confirma asistencia y disfruta jugando padel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main font-montserrat mb-4">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-text-secondary font-open-sans max-w-2xl mx-auto">
              Miles de jugadores ya están disfrutando de una mejor experiencia
              de padel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-bg-main rounded-lg p-6 border border-border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center">
                  <span className="text-bg-main font-semibold font-montserrat">
                    MR
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-main font-montserrat">
                    María Rodríguez
                  </h4>
                  <p className="text-text-secondary text-sm font-open-sans">
                    Jugadora Intermedia
                  </p>
                </div>
              </div>
              <p className="text-text-secondary font-open-sans">
                 &ldquo;Increíble plataforma. He encontrado grupos geniales y ahora juego 3 veces por semana. 
                 La organización de partidos es súper fácil.&rdquo;
               </p>
            </div>

            <div className="bg-bg-main rounded-lg p-6 border border-border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                  <span className="text-bg-main font-semibold font-montserrat">
                    CL
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-main font-montserrat">
                    Carlos López
                  </h4>
                  <p className="text-text-secondary text-sm font-open-sans">
                    Jugador Avanzado
                  </p>
                </div>
              </div>
              <p className="text-text-secondary font-open-sans">
                 &ldquo;Como organizador de un grupo, esta app me ha simplificado la vida. 
                 El sistema de confirmaciones y chat integrado es perfecto.&rdquo;
               </p>
            </div>

            <div className="bg-bg-main rounded-lg p-6 border border-border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-secondary rounded-full flex items-center justify-center">
                  <span className="text-bg-main font-semibold font-montserrat">
                    AG
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-main font-montserrat">
                    Ana García
                  </h4>
                  <p className="text-text-secondary text-sm font-open-sans">
                    Principiante
                  </p>
                </div>
              </div>
              <p className="text-text-secondary font-open-sans">
                 &ldquo;Empecé hace poco en el padel y gracias a Comuna Padel encontré un grupo 
                 de principiantes. Todos son muy amables y pacientes.&rdquo;
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-main font-montserrat mb-6">
            ¿Listo para unirte a la comunidad?
          </h2>
          <p className="text-xl text-text-secondary font-open-sans mb-8">
            Comienza gratis hoy y descubre una nueva forma de disfrutar el padel
          </p>
          <Link
            href="/auth#register"
            className="bg-accent-primary text-bg-main px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-primary/90 transition-colors font-open-sans inline-block"
          >
            Comenzar Ahora - Es Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-secondary border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="Comuna Padel" className="h-10 w-auto mr-3" />
                <h3 className="text-2xl font-bold text-accent-primary font-montserrat">
                  Comuna Padel
                </h3>
              </div>
              <p className="text-text-secondary font-open-sans mb-4">
                La plataforma definitiva para conectar jugadores de padel,
                organizar partidos y construir comunidades.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-text-main font-montserrat mb-4">
                Producto
              </h4>
              <ul className="space-y-2 text-text-secondary font-open-sans">
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Características
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-main font-montserrat mb-4">
                Soporte
              </h4>
              <ul className="space-y-2 text-text-secondary font-open-sans">
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-text-main transition-colors"
                  >
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-text-secondary font-open-sans">
              © 2024 Comuna Padel. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React from "react";
import { X, Calendar, MapPin, Clock, Users, Check, XIcon } from "lucide-react";

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  invitation: {
    title: string;
    content: string;
    matchDate?: string;
    location?: string;
    matchId?: string;
  };
  loading?: boolean;
}

export default function InvitationModal({
  isOpen,
  onClose,
  onAccept,
  onReject,
  invitation,
  loading = false,
}: InvitationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-bg-main border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-primary/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main font-heading">
                  Invitación a Partido
                </h3>
                <p className="text-sm text-text-secondary">
                  ¿Quieres participar en este partido?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-main hover:bg-bg-secondary/50 rounded-lg transition-all"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Invitation Details */}
          <div className="bg-bg-secondary/30 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-text-main">{invitation.title}</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              {invitation.content}
            </p>
            
            {/* Match Details */}
            {(invitation.matchDate || invitation.location) && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                {invitation.matchDate && (
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <Clock className="w-4 h-4 text-accent-primary" />
                    <span>{invitation.matchDate}</span>
                  </div>
                )}
                {invitation.location && (
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <MapPin className="w-4 h-4 text-accent-primary" />
                    <span>{invitation.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-3">
            <p className="text-xs text-text-secondary">
              💡 <strong>Tip:</strong> Una vez que respondas, no podrás cambiar tu decisión. 
              Asegúrate de revisar los detalles del partido.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex space-x-3">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-error/10 text-error hover:bg-error/20 border border-error/20 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-error/30 border-t-error rounded-full animate-spin" />
            ) : (
              <>
                <XIcon className="w-4 h-4" />
                <span>Rechazar</span>
              </>
            )}
          </button>
          
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-success/10 text-success hover:bg-success/20 border border-success/20 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Aceptar</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-bg-secondary rounded-xl p-4 flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
              <span className="text-text-main font-medium">Procesando respuesta...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
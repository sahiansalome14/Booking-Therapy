import React from 'react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { Calendar, Heart, Shield, TrendingUp, CheckCircle2, Sparkles, Zap, Activity, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Dynamic Gradient */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="relative container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8 border border-blue-200 shadow-lg hover:scale-105 transition-transform duration-300">
              <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Energía vital a tu alcance
              </span>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Conecta con terapeutas
              </span>
              <br />
              <span className="text-foreground">para tu bienestar</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              Reserva sesiones de bienestar con los mejores terapeutas independientes. 
              <span className="font-semibold text-blue-600"> Agenda, paga y gestiona</span> todo en un solo lugar.
            </p>
            
           
          <div className="relative z-20 flex gap-4 justify-center flex-wrap">
            <Link to="/search" className="cursor-pointer">
              <Button variant="gradient" size="lg" className="px-10 shadow-2xl">
                Reserva Sesión
              </Button>
            </Link>
            <Link to="/therapist/login" className="cursor-pointer">
              <Button variant="outline" size="lg" className="px-10">
                Soy Terapeuta
              </Button>
            </Link>
          </div>
            
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="#F8FAFF" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-full mb-4">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Características</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ¿Por qué elegir Vis Vitalis?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Una plataforma profesional diseñada para facilitar la conexión entre terapeutas y clientes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Agenda Fácil',
                description: 'Reserva sesiones en tiempo real con disponibilidad actualizada',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Shield,
                title: 'Pagos Seguros',
                description: 'Transacciones protegidas y verificadas para tu tranquilidad',
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                icon: Heart,
                title: 'Profesionales Verificados',
                description: 'Todos los terapeutas están certificados y verificados',
                gradient: 'from-teal-500 to-emerald-500'
              },
              {
                icon: TrendingUp,
                title: 'Gestión Completa',
                description: 'Controla tus sesiones, pagos e historial desde un dashboard',
                gradient: 'from-emerald-500 to-green-500'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-8 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 border border-blue-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gradient-to-b from-background to-blue-50/50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground text-lg">Tres simples pasos para tu bienestar</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1">
                <div className="h-full bg-gradient-to-r from-blue-300 via-cyan-300 to-emerald-300 rounded-full"></div>
              </div>

              {[
                {
                  number: '1',
                  title: 'Busca tu terapeuta',
                  description: 'Explora perfiles, especialidades y reseñas',
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  number: '2',
                  title: 'Reserva tu sesión',
                  description: 'Selecciona fecha, hora y realiza el pago seguro',
                  color: 'from-cyan-500 to-teal-500'
                },
                {
                  number: '3',
                  title: 'Disfruta tu bienestar',
                  description: 'Asiste a tu sesión y gestiona todo desde tu dashboard',
                  color: 'from-teal-500 to-emerald-500'
                }
              ].map((step, index) => (
                <div key={index} className="text-center relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl font-bold">{step.number}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">¿Listo para comenzar?</h2>
          <p className="text-xl mb-10 text-blue-50">
            Únete a cientos de personas que ya están cuidando su bienestar
          </p>
          <Link to="/search">
        <Button 
          size="lg" 
          className="relative px-10 bg-white hover:bg-blue-50 shadow-2xl overflow-visible group"
        >
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-blue-600 font-bold mix-blend-initial opacity-100 visible">
              Busca Terapeutas Ahora
            </span>
            <Sparkles className="w-5 h-5 ml-2 text-blue-600 opacity-100" />
          </div>
        </Button>
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

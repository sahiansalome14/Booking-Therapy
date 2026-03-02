import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { mockTherapists, SPECIALTIES } from '../data/mockData';

export default function TherapistSearch() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTherapists = mockTherapists.filter(therapist => {
    const matchesSpecialty = selectedSpecialty === 'Todos' || therapist.specialty === selectedSpecialty;
    const matchesSearch = therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         therapist.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Encuentra tu terapeuta ideal
          </h1>
          <p className="text-muted-foreground text-lg">Explora profesionales verificados en tu área</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-blue-100 rounded-2xl p-6 mb-10 shadow-lg shadow-blue-500/5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o especialidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Specialty Filter */}
            <div className="lg:w-64">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
              >
                {SPECIALTIES.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground font-medium">
            {filteredTherapists.length} {filteredTherapists.length === 1 ? 'terapeuta encontrado' : 'terapeutas encontrados'}
          </p>
        </div>

        {/* Therapists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map(therapist => (
            <div key={therapist.id} className="group bg-white border border-blue-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2">
              <div className="flex flex-col h-full">
                {/* Therapist Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold">{therapist.rating}</span>
                  </div>
                </div>

                {/* Therapist Info */}
                <div className="flex-1 flex flex-col p-6">
                  <h3 className="text-xl font-bold mb-1">{therapist.name}</h3>
                  <p className="text-blue-600 font-medium text-sm mb-3">{therapist.specialty}</p>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                    {therapist.bio}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                    <span className="font-medium">{therapist.reviews} reseñas</span>
                    <span>•</span>
                    <span className="font-bold text-blue-600">${therapist.price}/sesión</span>
                  </div>

                  <div className="mt-auto">
                    <Link to={`/therapist-profile/${therapist.id}`} className="block">
                      <Button variant="outline" className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                        Ver Disponibilidad
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTherapists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No se encontraron terapeutas con esos criterios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
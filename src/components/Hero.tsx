import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone } from 'lucide-react';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);

  const slides = [
    {
      image:
        'https://i.postimg.cc/Px2cZQf5/7-X2-A2923-1.jpg',
      title: 'YOUR TRUSTED LEGAL PARTNERS',
      description:
        "Providing exceptional legal services with integrity and expertise.",
    },
    {
      image:
        'https://i.postimg.cc/d09SPjyj/7-X2-A2913-1.jpg',
      title: 'STRENGTH THROUGH COLLABORATION',
      description:
        "Our experienced team delivers comprehensive legal solutions.",
    },
    {
      image:
        'https://i.postimg.cc/Wzd9ZRf5/7X2A2982.jpg',
      title: 'COMPASSIONATE ADVOCACY',
      description:
        'Professional excellence combined with genuine care for clients.',
    },
    {
      image:
        'https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      title: 'JUSTICE FOR EVERYONE',
      description:
        'Making quality legal representation accessible to all.',
    },
  ];

  // Preload images for better performance
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = slides.map((slide, index) => {
        return new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = slide.image;
        });
      });
      
      const results = await Promise.all(imagePromises);
      setImagesLoaded(results);
    };
    
    loadImages();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToServices = () => {
    const element = document.querySelector('#services');
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section
      id="home"
      className="relative h-[60vh] sm:h-[70vh] lg:h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Loading placeholder */}
          {!imagesLoaded[index] && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
            style={{
              objectFit: 'cover',
              objectPosition: 'center center',
              minHeight: '100%',
              width: '100%'
            }}
            loading={index === 0 ? 'eager' : 'lazy'}
            onLoad={() => {
              setImagesLoaded(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }}
            onError={(e) => {
              console.error(`Failed to load image: ${slide.image}`);
              // Set a fallback background
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
        </div>
      ))}

      {/* Invisible Navigation Buttons (Only top 60%) */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-0 w-1/2 h-[60%] z-20 opacity-0 cursor-pointer"
        aria-label="Previous Slide"
      />
      <button
        onClick={nextSlide}
        className="absolute right-0 top-0 w-1/2 h-[60%] z-20 opacity-0 cursor-pointer"
        aria-label="Next Slide"
      />

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
          <div className="min-h-[120px] sm:min-h-[140px] flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4 transition-all duration-500 drop-shadow-2xl tracking-wide" 
                style={{ fontFamily: 'Georgia, serif', color: '#FFFFFF', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {slides[currentSlide].title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-yellow-200 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-500 drop-shadow-xl font-semibold" 
               style={{ fontFamily: 'system-ui, -apple-system, sans-serif', textShadow: '2px 2px 0px #654321, 3px 3px 6px rgba(0,0,0,0.9)' }}>
              {slides[currentSlide].description}
            </p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center animate-fade-in-up-delay">
          <button
            onClick={scrollToContact}
            className="group btn-primary flex items-center space-x-2 transform hover:scale-105 shadow-lg text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Get Legal Consultation</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToServices}
            className="group btn-outline flex items-center space-x-2 transform hover:scale-105 shadow-lg text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4"
          >
            <span>Our Services</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 hover:scale-125 ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
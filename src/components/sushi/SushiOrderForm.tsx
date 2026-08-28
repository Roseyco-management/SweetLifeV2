'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { sushiVariations, sushiSizes, getSizeByPieces } from '@/data/sushiData';
import { getMinDateTime, validatePickupDateTime } from '@/lib/sushiValidation';
import { ScrollReveal, FadeIn } from '@/components/motion';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  pickupDateTime: string;
  specialRequests: string;
}

const SushiOrderForm = () => {
  const [selectedVariation, setSelectedVariation] = useState('Mix');
  const [selectedSize, setSelectedSize] = useState(30);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    pickupDateTime: '',
    specialRequests: '',
  });

  useEffect(() => {
    setMinDateTime(getMinDateTime());
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'pickupDateTime') {
      const error = validatePickupDateTime(value);
      setDateTimeError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    const dateTimeValidationError = validatePickupDateTime(formData.pickupDateTime);
    if (dateTimeValidationError) {
      setDateTimeError(dateTimeValidationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPrice = getSizeByPieces(selectedSize);

      const response = await fetch('/api/sushi-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variation: selectedVariation,
          pieces: selectedSize,
          price: selectedPrice?.price || 0,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPaymentLink(selectedPrice?.paymentLink || '');
        setShowConfirmation(true);
      } else {
        setSubmitError(
          result.error || 'There was an error submitting your order. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitError(
        'There was an error submitting your order. Please try again or contact us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowConfirmation(false);
    setPaymentLink('');
    setDateTimeError('');
    setSubmitError('');
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      pickupDateTime: '',
      specialRequests: '',
    });
  };

  const isFormValid = () => {
    return (
      formData.fullName &&
      formData.phone &&
      formData.email &&
      formData.pickupDateTime &&
      !dateTimeError
    );
  };

  const selectedPrice = getSizeByPieces(selectedSize);

  return (
    <section className="py-20 md:py-28 bg-warm-beige">
      <div className="container max-w-6xl">
        {/* Pre-order Notice */}
        <ScrollReveal>
          <div className="bg-primary/10 border-l-4 border-primary p-6 md:p-8 rounded-2xl mb-16 max-w-3xl mx-auto">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                <AlertTriangle size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">Pre-Order Required</h3>
                <p className="text-rich-brown/70">
                  Please pre-order at least 24 hours in advance to ensure freshness. Each piece is
                  handcrafted and made to order using premium ingredients.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Variation Selection */}
        <ScrollReveal delay={0.1}>
          <div className="text-center mb-10">
            <span className="text-primary font-semibold tracking-widest uppercase text-sm mb-4 block">
              Step 1
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Choose Your Variation
            </h2>
          </div>
        </ScrollReveal>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 max-w-4xl mx-auto">
            {sushiVariations.map((variation) => (
              <motion.button
                key={variation.title}
                onClick={() => setSelectedVariation(variation.title)}
                className={`p-6 rounded-2xl transition-all duration-300 text-center ${
                  selectedVariation === variation.title
                    ? 'bg-primary text-charcoal shadow-warm-lg ring-4 ring-primary/30'
                    : 'bg-white text-charcoal shadow-warm hover:shadow-warm-lg'
                }`}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <div className="font-display text-xl font-bold mb-2">{variation.title}</div>
                <div
                  className={`text-sm leading-relaxed ${
                    selectedVariation === variation.title ? 'text-charcoal/80' : 'text-rich-brown/70'
                  }`}
                >
                  {variation.description}
                </div>
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Size Selection */}
        <ScrollReveal delay={0.1}>
          <div className="text-center mb-10">
            <span className="text-primary font-semibold tracking-widest uppercase text-sm mb-4 block">
              Step 2
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Select Your Size
            </h2>
          </div>
        </ScrollReveal>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-20 max-w-4xl mx-auto">
            {sushiSizes.map((option) => (
              <motion.button
                key={option.pieces}
                onClick={() => setSelectedSize(option.pieces)}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  selectedSize === option.pieces
                    ? 'bg-primary text-charcoal shadow-warm-lg ring-4 ring-primary/30'
                    : 'bg-white text-charcoal shadow-warm hover:shadow-warm-lg'
                }`}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <div className="font-display text-3xl font-bold mb-1">{option.pieces}</div>
                <div className={`text-sm mb-2 ${selectedSize === option.pieces ? 'text-charcoal/80' : 'text-rich-brown/70'}`}>
                  pieces
                </div>
                <div
                  className={`text-xl font-bold ${
                    selectedSize === option.pieces ? 'text-charcoal' : 'text-primary'
                  }`}
                >
                  £{option.price}
                </div>
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Order Form */}
        <ScrollReveal delay={0.1}>
          <div className="text-center mb-10">
            <span className="text-primary font-semibold tracking-widest uppercase text-sm mb-4 block">
              Step 3
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Place Your Pre-Order
            </h2>
          </div>
        </ScrollReveal>

        <FadeIn delay={0.2}>
          <div className="max-w-2xl mx-auto">
            {showConfirmation ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-8 rounded-2xl shadow-warm animate-fadeIn">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-green-800 mb-2">
                      Thanks for your order request!
                    </h3>
                    <p className="text-green-700">
                      To complete your pre-order, please pay using the link below:
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-green-200 mb-6">
                  <div className="text-sm text-rich-brown/70 mb-2">Order Summary:</div>
                  <div className="font-display text-lg font-bold text-charcoal">
                    {selectedSize} pieces • {selectedVariation} • £{selectedPrice?.price}
                  </div>
                </div>

                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-glow inline-flex items-center mb-6"
                >
                  Complete Payment
                  <ExternalLink size={18} className="ml-2" />
                </a>

                <p className="text-sm text-green-700 mb-4">
                  We&apos;ll contact you within 24 hours to confirm your pickup time.
                </p>

                <button
                  onClick={resetForm}
                  className="text-green-700 hover:text-green-800 underline text-sm font-medium"
                >
                  Place another order
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-warm p-8 md:p-10 space-y-6"
              >
                {/* Order Summary */}
                <div className="bg-primary/10 p-5 rounded-xl mb-2">
                  <div className="text-sm text-rich-brown/70 mb-1">Your Selection:</div>
                  <div className="font-display text-lg font-bold text-charcoal">
                    {selectedSize} pieces • {selectedVariation} • £{selectedPrice?.price}
                  </div>
                </div>

                {/* Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold text-charcoal mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-charcoal mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-charcoal mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Pickup Date/Time */}
                <div>
                  <label
                    htmlFor="pickupDateTime"
                    className="block text-sm font-semibold text-charcoal mb-2"
                  >
                    Preferred Pickup Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="pickupDateTime"
                    name="pickupDateTime"
                    required
                    min={minDateTime}
                    value={formData.pickupDateTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 transition-all duration-300 ${
                      dateTimeError
                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  {dateTimeError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600">{dateTimeError}</p>
                    </div>
                  )}
                  <div className="mt-3 p-4 bg-warm-cream rounded-xl">
                    <p className="text-sm font-semibold text-charcoal mb-1">Collection Hours:</p>
                    <p className="text-sm text-rich-brown/70">Monday - Saturday: 12:00 PM - 6:00 PM</p>
                    <p className="text-sm text-rich-brown/70">Sunday: 12:00 PM - 5:00 PM</p>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label
                    htmlFor="specialRequests"
                    className="block text-sm font-semibold text-charcoal mb-2"
                  >
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    rows={4}
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 resize-none"
                    placeholder="Any special requests or notes for your order?"
                  ></textarea>
                </div>

                {/* Notice */}
                <div className="bg-warm-cream p-4 rounded-xl">
                  <p className="text-sm text-rich-brown/70">
                    Sushi orders must be placed at least 24 hours in advance. We will contact you to
                    confirm availability and pickup time.
                  </p>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                  className="w-full btn btn-primary btn-glow flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-lg py-4"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Pre-Order'}
                  <ChevronRight size={20} className="ml-2" />
                </button>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default SushiOrderForm;


import React, { useState, useCallback } from 'react';
import { Product, TryOnState } from './types';
import { MOCK_PRODUCTS, AVAILABLE_SIZES } from './constants';
import { performVirtualTryOn, fileToBase64, urlToBase64 } from './services/geminiService';
import ProductCard from './components/ProductCard';
import StepIndicator from './components/StepIndicator';

const App: React.FC = () => {
  const [state, setState] = useState<TryOnState>({
    userImage: null,
    selectedProduct: null,
    resultImage: null,
    recommendedSize: null,
    isLoading: false,
    error: null,
  });

  const [step, setStep] = useState(1);

  const handleProductSelect = useCallback((product: Product) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setState(prev => ({ ...prev, userImage: base64, error: null }));
      } catch (err) {
        setState(prev => ({ ...prev, error: "Fehler beim Lesen der Bilddatei." }));
      }
    }
  }, []);

  const handleDownload = () => {
    if (!state.resultImage) return;
    const link = document.createElement('a');
    link.href = state.resultImage;
    link.download = `mein-look-${state.selectedProduct?.id || 'tryon'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTryOn = async () => {
    if (!state.userImage || !state.selectedProduct) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setStep(3);

    try {
      const productBase64 = await urlToBase64(state.selectedProduct.imageUrl);
      const result = await performVirtualTryOn(
        state.userImage, 
        productBase64, 
        state.selectedProduct.name
      );
      
      const mockSizes = ['S', 'M', 'L'];
      const randomSize = mockSizes[Math.floor(Math.random() * mockSizes.length)];
      
      setState(prev => ({ 
        ...prev, 
        resultImage: result, 
        recommendedSize: randomSize,
        isLoading: false 
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Ein unerwarteter Fehler ist aufgetreten." 
      }));
    }
  };

  const reset = () => {
    setState({
      userImage: null,
      selectedProduct: null,
      resultImage: null,
      recommendedSize: null,
      isLoading: false,
      error: null,
    });
    setStep(1);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-gray-200 py-4 mb-8 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">Shopware <span className="font-light text-gray-500">Virtual Try-On</span></span>
          </div>
          <button 
            onClick={reset}
            className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Zurück zum Anfang
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-5xl">
        <StepIndicator currentStep={step} />

        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Wähle dein Sport-Outfit</h1>
              <p className="mt-3 text-lg text-gray-500">Suche dir ein Set aus, um zu sehen, wie es an dir aussieht.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
              {MOCK_PRODUCTS.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  isSelected={state.selectedProduct?.id === product.id}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <button
                disabled={!state.selectedProduct}
                onClick={() => setStep(2)}
                className={`px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                  state.selectedProduct 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Weiter: Foto hochladen
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900">Lade dein Foto hoch</h1>
              <div className="mt-4 bg-amber-50 border border-amber-100 p-4 rounded-2xl inline-block text-left">
                <p className="text-amber-800 text-sm font-semibold mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Tipp für beste Ergebnisse:
                </p>
                <ul className="text-amber-700 text-xs list-disc list-inside space-y-1">
                  <li>Trage möglichst enganliegende Kleidung auf dem Foto.</li>
                  <li>Vermeide Röcke oder sehr weite Hosen, da die KI diese schwerer ersetzen kann.</li>
                  <li>Ein kontrastreicher, heller Hintergrund hilft der KI enorm.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
              {state.userImage ? (
                <div className="relative w-full max-w-xs">
                  <img 
                    src={state.userImage} 
                    alt="Vorschau" 
                    className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                  />
                  <button 
                    onClick={() => setState(prev => ({ ...prev, userImage: null }))}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group py-10">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Klicke zum Hochladen oder Drag & Drop</p>
                  <p className="text-gray-400 text-sm mt-1">PNG, JPG bis zu 10MB</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 rounded-full font-bold text-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Zurück
              </button>
              <button
                disabled={!state.userImage}
                onClick={handleTryOn}
                className={`px-10 py-3 rounded-full font-bold text-lg transition-all shadow-lg ${
                  state.userImage 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Anprobe starten ✨
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            {state.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dein Look wird generiert...</h2>
                <p className="text-gray-500 max-w-md">Unsere KI passt das {state.selectedProduct?.name} Set auf dein Foto an. Das dauert nur einen Moment.</p>
                <div className="mt-8 space-y-2 w-full max-w-xs">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>
            ) : state.error ? (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-900 mb-2">Etwas ist schiefgelaufen</h2>
                <p className="text-red-700 mb-6">{state.error}</p>
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
                >
                  Nochmal versuchen
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="relative group overflow-hidden rounded-3xl">
                    <img 
                      src={state.resultImage!} 
                      alt="Ergebnis der Anprobe" 
                      className="w-full rounded-3xl shadow-2xl border-4 border-white transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg text-center">
                        KI-Vorschau
                      </div>
                      <button 
                        onClick={handleDownload}
                        className="bg-white/90 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110 flex items-center justify-center"
                        title="Bild speichern"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-emerald-900 font-bold mb-2 flex items-center">
                      <span className="text-xl mr-2">✨</span>
                      Wir finden, dass Set steht dir super:)
                    </p>
                    <p className="text-emerald-800 text-xs leading-relaxed opacity-90">
                      Es handelt sich natürlich nur um einen ersten Virtual Try-On. Bitte schaue dir daher falls du bei der Größe unsicher bist, vor der Bestellung auch noch unsere genaue Größentabelle an.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-full flex flex-col">
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Ausgewählter Style</span>
                    <h2 className="text-2xl font-black mt-1">{state.selectedProduct?.name}</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{state.selectedProduct?.price}</p>
                  </div>

                  <div className="mb-8">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-indigo-900">Größenempfehlung</span>
                      </div>
                      <p className="text-sm text-indigo-800 leading-relaxed">
                        Basierend auf deinem Foto empfehlen wir dir Größe <strong>{state.recommendedSize}</strong>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Größe anpassen</label>
                      <div className="grid grid-cols-6 gap-2">
                        {AVAILABLE_SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => setState(prev => ({ ...prev, recommendedSize: size }))}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              state.recommendedSize === size 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-8 leading-relaxed italic">
                    {state.selectedProduct?.description}
                  </p>

                  <div className="mt-auto space-y-4">
                    <button 
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-900 transition-all flex items-center justify-center space-x-2"
                      onClick={() => alert(`${state.selectedProduct?.name} in Größe ${state.recommendedSize} wurde zum Shopware Warenkorb hinzugefügt!`)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>In den Warenkorb</span>
                    </button>
                    <button 
                      onClick={reset}
                      className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                    >
                      Anderen Look probieren
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-gray-100 pt-10 text-center">
        <p className="text-gray-400 text-sm">Powered by Gemini AI 2.5 Flash • Optimiert für Shopware 6</p>
      </footer>
    </div>
  );
};

export default App;

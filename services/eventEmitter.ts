// Servicio simple de eventos para comunicación entre componentes

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  // Suscribirse a un evento
  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Devolver una función para cancelar la suscripción
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emitir un evento
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
}

// Exportar una instancia única para toda la aplicación
export const eventEmitter = new EventEmitter();

// Eventos disponibles
export const EVENTS = {
  MOVIE_SAVED: 'movie_saved',
};

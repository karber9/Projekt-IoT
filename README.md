Elementy IoT - system rozproszony z wykorzystaniem urządzeń RaspberryPi

Projekt polega na stworzeniu systemu rozproszonego, w którym użytkownik za pomocą aplikacji webowej wysyła zadanie obliczeniowe do serwera. Serwer nie wykonuje obliczeń samodzielnie – przekazuje je do urządzenia Raspberry Pi, które pełni rolę zewnętrznego modułu obliczeniowego. Po wykonaniu zadania wynik wraca do serwera i następnie do użytkownika. System umożliwia śledzenie pełnego przepływu danych między klientem, serwerem i urządzeniem. Komunikacja jest zabezpieczona kryptograficznie bez użycia HTTPS. Kluczowe funkcjonalności programu obejmują monitorowanie ścieżki danych między klientem, serwerem i agentem, komunikację zapezpieczoną na poziomie aplikacji oraz wykorzystanie WebSockets do powiadomień o stanie zadań. 

Na system składają się następujące warstwy:
Frontend - Webowy panel użytkownika (Next.js) do wysyłania zadań i przeglądania historii.
Backend - Serwer FastAPI zarządzający bazą danych, autoryzacją oraz kolejkami zadań.
IoT Communication - Komunikacja za pośrednictwem brokera MQTT.
Warstwa wykonawcza: Urządzenia Raspberry Pi działające jako agenci nasłuchujący poleceń.
Data Layer: Relacyjna baza danych PostgreSQL obsługiwana przez SQLAlchemy ORM.

# FRONTEND - KLIENT

Aktualnie klient wysyła requesty na port :8000. Wszystkie requesty i konfiguracja komunikacji z serwerem znajduje się w frontend/lib/api.

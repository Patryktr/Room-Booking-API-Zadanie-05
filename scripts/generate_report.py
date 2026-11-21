from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Sprawozdanie_Zadanie_05_Room_Booking_API.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

font_dir = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Body", str(font_dir / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", str(font_dir / "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("Mono", str(font_dir / "consola.ttf")))

NAVY = colors.HexColor("#172554")
BLUE = colors.HexColor("#2563EB")
LIGHT = colors.HexColor("#EFF6FF")
GREEN = colors.HexColor("#15803D")
RED = colors.HexColor("#B91C1C")
GRAY = colors.HexColor("#475569")
LINE = colors.HexColor("#CBD5E1")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName="Body-Bold", fontSize=25, leading=30,
                          textColor=NAVY, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name="SubTitle", fontName="Body", fontSize=12, leading=17,
                          textColor=GRAY, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1X", fontName="Body-Bold", fontSize=18, leading=22,
                          textColor=NAVY, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name="H2X", fontName="Body-Bold", fontSize=12.5, leading=16,
                          textColor=BLUE, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyX", fontName="Body", fontSize=9.3, leading=13.2,
                          textColor=colors.HexColor("#1E293B"), spaceAfter=6))
styles.add(ParagraphStyle(name="Small", fontName="Body", fontSize=7.8, leading=10.5,
                          textColor=GRAY))
styles.add(ParagraphStyle(name="Head", fontName="Body-Bold", fontSize=7.8, leading=10.5,
                          textColor=colors.white))
styles.add(ParagraphStyle(name="CodeX", fontName="Mono", fontSize=7.2, leading=9.2,
                          textColor=colors.HexColor("#E2E8F0")))
styles.add(ParagraphStyle(name="Callout", fontName="Body-Bold", fontSize=10, leading=14,
                          textColor=GREEN))


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18*mm, 16*mm, 192*mm, 16*mm)
    canvas.setFont("Body", 7.5)
    canvas.setFillColor(GRAY)
    canvas.drawString(18*mm, 10.5*mm, "Zadanie 05 — Room Booking API")
    canvas.drawRightString(192*mm, 10.5*mm, f"strona {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm,
                      topMargin=18*mm, bottomMargin=20*mm,
                      title="Sprawozdanie — Zadanie 05 Room Booking API",
                      author="Patryk")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates(PageTemplate(id="all", frames=frame, onPage=header_footer))


def P(text, style="BodyX"):
    return Paragraph(text, styles[style])


def bullets(items):
    return ListFlowable([ListItem(P(x), leftIndent=10) for x in items], bulletType="bullet",
                        leftIndent=16, bulletFontName="Body", bulletFontSize=6, spaceAfter=5)


def terminal(title, lines, color=GREEN):
    head = Table([[P(title, "Small")]], colWidths=[doc.width-10*mm])
    head.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#0F172A")),
                              ("TEXTCOLOR", (0,0), (-1,-1), color),
                              ("LEFTPADDING", (0,0), (-1,-1), 7),
                              ("TOPPADDING", (0,0), (-1,-1), 5),
                              ("BOTTOMPADDING", (0,0), (-1,-1), 3)]))
    body = Table([[P("<br/>".join(lines), "CodeX")]], colWidths=[doc.width-10*mm])
    body.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#111827")),
                              ("LEFTPADDING", (0,0), (-1,-1), 7),
                              ("RIGHTPADDING", (0,0), (-1,-1), 7),
                              ("TOPPADDING", (0,0), (-1,-1), 6),
                              ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
    return KeepTogether([head, body, Spacer(1, 6)])


story = [Spacer(1, 32*mm), P("SPRAWOZDANIE", "TitleX"),
         P("Zadanie 05 — Room Booking API", "TitleX"), Spacer(1, 5*mm),
         P("Testy jednostkowe i integracyjne · Docker Compose · eventy i audit log · CI/CD", "SubTitle"),
         Spacer(1, 16*mm)]

meta = Table([
    [P("Repozytorium", "Small"), P("github.com/Patryktr/Room-Booking-API-Zadanie-05")],
    [P("Widoczność", "Small"), P("prywatne")],
    [P("Gałąź / commit", "Small"), P("main / ca0e783")],
    [P("Data weryfikacji", "Small"), P("21.11.2026")],
], colWidths=[38*mm, 120*mm])
meta.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), LIGHT), ("BOX", (0,0), (-1,-1), .6, LINE),
                          ("INNERGRID", (0,0), (-1,-1), .35, LINE),
                          ("VALIGN", (0,0), (-1,-1), "TOP"),
                          ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
                          ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [meta, Spacer(1, 18*mm), P("Wynik końcowy", "H2X"),
          P("Projekt spełnia wszystkie pięć części zadania. Lokalnie przeszło <b>26 testów</b>, obraz aplikacji został zbudowany, usługi Docker Compose są zdrowe, a GitHub Actions poprawnie wykrył celową usterkę i po poprawce zakończył pipeline sukcesem.", "Callout"), PageBreak()]

story += [P("1. Cel i zakres", "H1X"),
          P("Celem było rozszerzenie istniejącego Room Booking API o automatyczne testy, powtarzalne środowisko kontenerowe, wewnętrzną obsługę zdarzeń oraz pipeline ciągłej integracji. Punktem wyjścia była wersja z Zadania 04; implementacja Zadania 05 znajduje się w oddzielnym repozytorium."),
          P("Zrealizowany zakres", "H2X"), bullets([
              "18 testów jednostkowych działających bez bazy danych, z repozytoriami in-memory i mockami.",
              "8 testów integracyjnych HTTP z Supertest i osobną bazą PostgreSQL.",
              "Dockerfile, Docker Compose, migracje, seedowanie, healthcheck i graceful shutdown.",
              "EventEmitter, zdarzenia rezerwacji, odporny listener oraz tabela audit_log.",
              "GitHub Actions uruchamiane dla push do main i pull requestów, wraz z budową obrazu Docker.",
          ]), P("Architektura rozwiązania", "H2X")]

arch = Table([
    [P("Warstwa", "Head"), P("Odpowiedzialność", "Head"), P("Technologie / pliki", "Head")],
    [P("HTTP"), P("routing, walidacja, autoryzacja, obsługa błędów"), P("Express, JWT, Joi")],
    [P("Domena"), P("reguły rezerwacji i transakcje"), P("reservationService.js")],
    [P("Dane"), P("repozytoria i migracje"), P("Knex, PostgreSQL")],
    [P("Zdarzenia"), P("publikacja i niezależni odbiorcy"), P("EventEmitter, audit listener")],
    [P("Dostarczenie"), P("kontenery i automatyczna weryfikacja"), P("Docker Compose, GitHub Actions")],
], colWidths=[30*mm, 70*mm, 65*mm])
arch.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                          ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                          ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
                          ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                          ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
story += [arch, PageBreak()]

story += [P("2. Testy jednostkowe", "H1X"),
          P("Testy uruchamiają serwis bez połączenia z PostgreSQL. Zależności są wstrzykiwane jako proste repozytoria in-memory, a event bus jest mockowany. Dzięki temu testy są szybkie, deterministyczne i sprawdzają wyłącznie logikę domenową."),
          P("Pokryte przypadki", "H2X"), bullets([
              "tworzenie prawidłowej rezerwacji i publikacja eventu po zatwierdzeniu transakcji;",
              "odrzucenie nachodzących terminów i zachowanie stykających się przedziałów;",
              "minimalny i maksymalny czas rezerwacji oraz niepoprawna kolejność dat;",
              "pojemność sali i liczba uczestników;",
              "ownership: odczyt i anulowanie cudzej rezerwacji zwracają 404;",
              "idempotentne anulowanie oraz pojedyncza publikacja reservation.cancelled;",
              "izolacja błędu jednego listenera od pozostałych odbiorców.",
          ]), terminal("Rys. 1. Wynik testów jednostkowych", [
              "> npm run test:unit", "Test Suites: 2 passed, 2 total", "Tests:       18 passed, 18 total",
              "Snapshots:   0 total", "Time:        0.687 s"
          ]), P("Test mutacyjny", "H2X"),
          P("W celu udowodnienia wartości asercji celowo zmieniono warunek idempotencji anulowania. Test oczekiwał dwóch publikacji eventu zamiast jednej. GitHub Actions zakończył się błędem. Po przywróceniu właściwej asercji pipeline przeszedł na zielono. Historia obu commitów pozostała w PR #1 jako dowód red/green."), PageBreak()]

story += [P("3. Testy integracyjne", "H1X"),
          P("Testy integracyjne uruchamiają rzeczywistą aplikację Express i wykonują żądania przez Supertest. Dane trafiają do osobnej bazy PostgreSQL na porcie 5434. Przed scenariuszami wykonywane są migracje, a stan tabel jest czyszczony w kontrolowany sposób."),
          P("Zestaw ośmiu scenariuszy", "H2X")]

rows = [[P("#", "Head"), P("Scenariusz", "Head"), P("Oczekiwany rezultat", "Head")],
        [P("1"), P("rejestracja, logowanie, /auth/me"), P("201 / 200 / 200")],
        [P("2"), P("utworzenie rezerwacji"), P("201, Location, rekord w DB")],
        [P("3"), P("niepoprawne body"), P("400 z details")],
        [P("4"), P("endpoint prywatny bez tokenu"), P("401")],
        [P("5"), P("USER tworzy salę"), P("403")],
        [P("6"), P("odczyt cudzej rezerwacji"), P("404")],
        [P("7"), P("konflikt terminów"), P("409 ROOM_ALREADY_BOOKED")],
        [P("8"), P("paginacja i audit log ADMIN"), P("poprawne totals i wpisy")]]
t = Table(rows, colWidths=[10*mm, 88*mm, 67*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                       ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                       ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
                       ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
                       ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
story += [t, Spacer(1, 6), terminal("Rys. 2. Wynik testów integracyjnych", [
    "> npm run test:integration", "POST /api/reservations -> 201", "POST /api/reservations -> 409",
    "GET /api/admin/audit-log?eventType=reservation.created -> 200", "Test Suites: 1 passed, 1 total",
    "Tests:       8 passed, 8 total", "Time:        3.196 s"
]), PageBreak()]

story += [P("4. Docker i uruchomienie", "H1X"),
          P("Aplikacja korzysta z lekkiego obrazu node:22-alpine. Docker Compose uruchamia usługę API oraz PostgreSQL 16 Alpine, przekazuje konfigurację przez zmienne środowiskowe i wykorzystuje nazwany wolumen. Start API jest zależny od zdrowia bazy; przed uruchomieniem serwera wykonywane są migracje."),
          P("Elementy wdrożenia", "H2X"), bullets([
              "healthcheck bazy i endpointu /health aplikacji;",
              "restart-safe migracje Knex i oddzielne seedowanie;",
              "brak sekretów w repozytorium — dostępny jest wyłącznie plik .env.example;",
              "obsługa SIGTERM: zatrzymanie przyjmowania żądań, zamknięcie HTTP i puli DB;",
              "README opisujący tryb lokalny, testowy i kontenerowy.",
          ]), terminal("Rys. 3. Stan środowiska Docker Compose", [
              "NAME                     SERVICE  STATUS", "room-booking-api-api-1   api      Up (healthy)",
              "room-booking-api-db-1    db       Up (healthy)", "Port API: 0.0.0.0:3000->3000/tcp"
          ]), terminal("Rys. 4. Graceful shutdown", [
              "SIGTERM received - starting graceful shutdown", "HTTP server and database pool closed"
          ]), PageBreak()]

story += [P("5. Eventy i audit log", "H1X"),
          P("Po zatwierdzeniu transakcji serwis publikuje reservation.created albo reservation.cancelled. Publikacja po commit zapobiega zapisaniu audytu dla operacji wycofanej. Event bus uruchamia listenery niezależnie — wyjątek jednego odbiorcy jest logowany, ale nie blokuje pozostałych."),
          P("Przepływ zdarzenia", "H2X")]
flow = Table([[P("Transakcja DB"), P("→"), P("commit"), P("→"), P("EventEmitter"), P("→"), P("audit_log")]],
             colWidths=[34*mm, 8*mm, 22*mm, 8*mm, 39*mm, 8*mm, 38*mm])
flow.setStyle(TableStyle([("BACKGROUND", (0,0), (0,0), LIGHT), ("BACKGROUND", (2,0), (2,0), LIGHT),
                          ("BACKGROUND", (4,0), (4,0), LIGHT), ("BACKGROUND", (6,0), (6,0), LIGHT),
                          ("BOX", (0,0), (0,0), .6, BLUE), ("BOX", (2,0), (2,0), .6, BLUE),
                          ("BOX", (4,0), (4,0), .6, BLUE), ("BOX", (6,0), (6,0), .6, BLUE),
                          ("ALIGN", (0,0), (-1,-1), "CENTER"), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                          ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8)]))
story += [flow, Spacer(1, 8), P("Migracja tworzy tabelę audit_log z typem zdarzenia, identyfikatorem encji, identyfikatorem użytkownika, payloadem JSON i datą. Endpoint <b>GET /api/admin/audit-log</b> jest dostępny tylko dla roli ADMIN i obsługuje filtrowanie oraz paginację."),
          P("Przykładowy wpis", "H2X"), terminal("Audit record", [
              "event_type: reservation.created", "entity_id: 42", "user_id: 7",
              "payload: { roomId, startTime, endTime, attendees }"
          ]), PageBreak()]

story += [P("6. GitHub Actions i scenariusz red/green", "H1X"),
          P("Workflow CI uruchamia się dla każdego push do main oraz pull requestu. Korzysta z usługi PostgreSQL, instaluje zależności przez npm ci, uruchamia pełny zestaw testów i buduje obraz Docker. Badge statusu znajduje się w README."),
          P("Dowód red/green — Pull Request #1", "H2X")]
ci = Table([
    [P("Etap", "Head"), P("Commit / run", "Head"), P("Rezultat", "Head")],
    [P("RED"), P("ebe1623 / run 44948403367"), P("CI / test — failure, celowo błędna asercja")],
    [P("GREEN"), P("07ea7c5 / run 44948487264"), P("CI / test — success w 41 s")],
    [P("MERGE"), P("ca0e783"), P("PR #1 scalony do main")],
], colWidths=[24*mm, 65*mm, 76*mm])
ci.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                        ("TEXTCOLOR", (0,1), (0,1), RED), ("TEXTCOLOR", (0,2), (0,3), GREEN),
                        ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
                        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                        ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [ci, Spacer(1, 8), terminal("Rys. 5. GitHub Actions — poprawiony PR", [
    "All checks have passed", "1 successful check", "CI / test (pull_request) — Successful in 41s",
    "No conflicts with base branch"
]), P("Odnośniki", "H2X"), bullets([
    "Repozytorium: https://github.com/Patryktr/Room-Booking-API-Zadanie-05",
    "PR #1: https://github.com/Patryktr/Room-Booking-API-Zadanie-05/pull/1",
    "Run RED: https://github.com/Patryktr/Room-Booking-API-Zadanie-05/actions/runs/44948403367",
    "Run GREEN: https://github.com/Patryktr/Room-Booking-API-Zadanie-05/actions/runs/44948487264",
]), PageBreak()]

story += [P("7. Podsumowanie", "H1X"),
          P("Zadanie zakończono kompletnym, budowalnym i automatycznie weryfikowanym rozwiązaniem. Najważniejsze reguły biznesowe są chronione szybkimi testami jednostkowymi, a zachowanie API, autoryzacja i integracja z bazą — testami end-to-end na poziomie HTTP. Kontenery zapewniają powtarzalne uruchomienie, event bus oddziela skutki uboczne od transakcji, a CI blokuje regresje."),
          P("Kryteria odbioru", "H2X")]
checks = [
    ("Testy jednostkowe ≥ 12", "18 — spełnione"), ("Testy integracyjne ≥ 8", "8 — spełnione"),
    ("Dockerfile i Compose", "spełnione"), ("Migracje, healthcheck, shutdown", "spełnione"),
    ("Eventy i audit log", "spełnione"), ("GitHub Actions + badge", "spełnione"),
    ("Scenariusz red/green PR", "spełnione"), ("Prywatne repozytorium", "spełnione"),
]
ct = Table([[P(a), P(b)] for a,b in checks], colWidths=[96*mm, 69*mm])
ct.setStyle(TableStyle([("GRID", (0,0), (-1,-1), .4, LINE), ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.white, LIGHT]),
                        ("TEXTCOLOR", (1,0), (1,-1), GREEN), ("FONTNAME", (1,0), (1,-1), "Body-Bold"),
                        ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
                        ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [ct, Spacer(1, 12), P("Polecenia odtworzeniowe", "H2X"), terminal("Uruchomienie", [
    "npm ci", "docker compose up -d --build", "npm test", "docker compose exec api npx knex seed:run"
]), P("Koniec sprawozdania.", "Small")]

doc.build(story)
print(OUT)

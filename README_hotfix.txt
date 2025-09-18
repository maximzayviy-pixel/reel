Hotfix pack:
1) Реальный realtime баланс (stars→₽) — компонент `BalanceText.tsx` и хук `useRealtimeBalance`.
2) Страница пополнения с красивыми табами и фиксой `unauthorized` — при запросе в API передаётся `x-telegram-init-data` из `Telegram.WebApp.initData`.
3) Отключён пререндер: `export const dynamic = 'force-dynamic'` и обёртка `Suspense` для useSearchParams.
Подключение:
- Импортируй `BalanceText` на главной и передавай `user?.tg_id`.
- Залей файлы в те же пути.

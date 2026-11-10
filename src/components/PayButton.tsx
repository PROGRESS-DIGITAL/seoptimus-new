"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    cp?: { CloudPayments: new () => { pay: (kind: string, opts: object, cb: object) => void } };
  }
}

export default function PayButton({
  publicId,
  email,
  amount,
  description,
  data,
  recurrent,
  label,
}: {
  publicId: string;
  email: string;
  amount: number;
  description: string;
  data: Record<string, unknown>;
  recurrent?: boolean;
  label: string;
}) {
  const [msg, setMsg] = useState("");
  if (!publicId)
    return <div className="text-xs text-slate-500">Оплата не настроена (нет CLOUDPAYMENTS_PUBLIC_ID)</div>;
  return (
    <>
      <Script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" strategy="lazyOnload" />
      <button
        className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
        onClick={() => {
          if (!window.cp) return setMsg("Платёжный виджет ещё загружается, попробуйте через секунду");
          new window.cp.CloudPayments().pay(
            "charge",
            {
              publicId,
              description,
              amount,
              currency: "RUB",
              accountId: email, // как в старой версии: подписки привязаны к email
              email,
              skin: "modern",
              data: {
                ...data,
                ...(recurrent ? { CloudPayments: { recurrent: { interval: "Month", period: 1 } } } : {}),
              },
            },
            {
              onSuccess: () => {
                setMsg("Оплата прошла, кредиты начислятся в течение минуты");
                setTimeout(() => window.location.reload(), 4000);
              },
              onFail: (reason: string) => setMsg(`Оплата не прошла: ${reason}`),
            },
          );
        }}
      >
        {label}
      </button>
      {msg && <div className="mt-2 text-xs text-slate-600">{msg}</div>}
    </>
  );
}

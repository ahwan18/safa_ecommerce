-- ============================================================
-- Migration: Duitku callback/payment schema hardening
-- Jalankan di Supabase SQL Editor jika tabel/kolom payment belum lengkap.
-- ============================================================

alter table orders
  add column if not exists payment_provider varchar(100),
  add column if not exists payment_reference varchar(200),
  add column if not exists payment_due_at timestamp,
  add column if not exists payment_paid_at timestamp,
  add column if not exists payment_details jsonb;

create table if not exists payment_transactions (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  transaction_reference varchar(200) not null,
  amount decimal(12, 2) not null,
  currency varchar(10) not null default 'IDR',
  payment_method varchar(100),
  payment_provider varchar(100),
  payment_channel varchar(100),
  status varchar(50) not null default 'pending',
  payment_details jsonb,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_transactions_transaction_reference_key'
      and conrelid = 'payment_transactions'::regclass
  ) then
    alter table payment_transactions
      add constraint payment_transactions_transaction_reference_key unique (transaction_reference);
  end if;
end;
$$;

create index if not exists idx_payment_transactions_order_id
  on payment_transactions(order_id);

create index if not exists idx_payment_transactions_status
  on payment_transactions(status);

create index if not exists idx_payment_transactions_provider
  on payment_transactions(payment_provider);

create or replace function update_payment_transactions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_payment_transactions_updated_at on payment_transactions;
create trigger trg_payment_transactions_updated_at
  before update on payment_transactions
  for each row
  execute function update_payment_transactions_updated_at();

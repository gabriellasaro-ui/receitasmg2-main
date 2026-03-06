create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users (id) not null,
    title text not null,
    message text not null,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;
drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
drop policy if exists "Admins can insert notifications" on notifications;
create policy "Admins can insert notifications" on notifications for insert with check (true);
drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

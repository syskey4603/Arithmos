create table if not exists topic_ratings (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  topic      text        not null,
  elo        integer     not null default 1200,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

alter table topic_ratings enable row level security;

create policy "select own" on topic_ratings for select using (auth.uid() = user_id);
create policy "insert own" on topic_ratings for insert with check (auth.uid() = user_id);
create policy "update own" on topic_ratings for update using (auth.uid() = user_id);

alter table submissions add column if not exists submitted_answer text;
alter table submissions add column if not exists topic text;
alter table submissions add column if not exists topic_elo_after integer;

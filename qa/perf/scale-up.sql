-- Multiplies the operational records in a COPY of the QA database so query
-- timings can be taken at a realistic volume. Never run against a real database.
--   psql steelwise_qa_perf -v copies=300 -f qa/perf/scale-up.sql
-- Every copied row gets a new id derived from the old one, so links between
-- copied rows stay intact. Reference data (branches, products, customers) is not copied.
\set ON_ERROR_STOP on
select current_database() ~ 'perf' as ok \gset
\if :ok
\else
  \echo 'Refusing: database name must contain "perf"'
  \quit
\endif
set session_replication_role = replica; -- skip FK checks while loading; rows are consistent by construction
create temp table _set(t text primary key);
insert into _set values ('Order'),('OrderLine'),('Coil'),('Inventory'),('MaterialMovement'),('OrderLineAllocation'),
  ('Job'),('Shipment'),('ShipmentItem'),('Invoice'),('InvoiceLine'),('Payment');
do $$
declare r record; cols text; exprs text; c record; n int := current_setting('perf.copies')::int;
begin
  for r in select t from _set loop
    cols := ''; exprs := '';
    for c in
      select a.attname col, format_type(a.atttypid, a.atttypmod) typ,
        exists(select 1 from pg_index i where i.indrelid = a.attrelid and i.indisprimary and a.attnum = any(i.indkey)) is_pk,
        exists(select 1 from pg_constraint k where k.conrelid = a.attrelid and k.contype = 'f' and a.attnum = any(k.conkey)
               and (select relname from pg_class where oid = k.confrelid) in (select t from _set)) is_fk,
        exists(select 1 from pg_index i where i.indrelid = a.attrelid and i.indisunique and not i.indisprimary and i.indnatts = 1 and a.attnum = any(i.indkey)) is_uq
      from pg_attribute a where a.attrelid = format('%I', r.t)::regclass and a.attnum > 0 and not a.attisdropped
    loop
      cols := cols || format('%I,', c.col);
      if c.typ = 'text' and (c.is_pk or c.is_fk) then exprs := exprs || format('case when %1$I is null then null else md5(%1$I || g)::uuid::text end,', c.col);
      elsif c.typ = 'text' and c.is_uq then exprs := exprs || format('%I || ''-'' || g,', c.col);
      else exprs := exprs || format('%I,', c.col);
      end if;
    end loop;
    execute format('insert into %I (%s) select %s from %I, generate_series(1, %s) g', r.t, rtrim(cols, ','), rtrim(exprs, ','), r.t, n);
    raise notice '% done', r.t;
  end loop;
end $$;
set session_replication_role = default;
analyze;
select relname, n_live_tup from pg_stat_user_tables where relname in (select t from _set) order by 2 desc;

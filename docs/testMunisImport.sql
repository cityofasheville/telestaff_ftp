use muntest

select * from avl.telestaff_import_time_apd

exec avl.sptelestaff_insert_time_apd

  SELECT *
  FROM prtmatdt
  WHERE	prtd_from >= '2020-12-12'

  delete
    FROM prtmatdt
  WHERE	prtd_from >= '2020-12-12'

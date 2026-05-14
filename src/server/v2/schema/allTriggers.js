const allTriggers = {
  // auto-increments the 'published' column of series
  // whenever data in series get updated.
  // the trigger will get dropped whenever the series table is dropped.
  publishedTrigger: `
create trigger if not exists increment_published
after update on series
for each row
begin
  update series
  set published = old.published + 1
  where series.id = old.id and old.published is not null;
end`
};

module.exports = allTriggers;
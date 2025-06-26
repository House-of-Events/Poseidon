/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('daily_fixtures_routed', function (table) {
    table
      .string('id')
      .primary()
      .defaultTo(
        knex.raw(
          "concat('dfr', lpad(floor(random() * 1000000)::text, 6, '0'))"
        )
      );
    table.string('fixture_id').notNullable();
    table.string('match_id').notNullable(); 
    table.timestamp('date_time_of_match').notNullable();
    table.string('fixture_type').notNullable(); 
    

    // Users
    table.integer("count_users_to_inform").notNullable();
    table.integer("count_users_successfully_notified").notNullable();
    table.integer("count_users_failed_to_notify").notNullable();

    // Notification
    table.string('notification_type').notNullable().checkIn(['email', 'slack']).defaultTo('slack');
    table.string('notification_status').notNullable().checkIn(['partial', 'success', 'failed','pending']).defaultTo('pending');
    table.timestamp('date_time_of_notification_sent').nullable();


    // Timestamps
    table.timestamp('date_created').defaultTo(knex.fn.now());
    table.timestamp('date_updated').defaultTo(knex.fn.now());
    table.timestamp('date_deleted').nullable();

  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('daily_fixtures_routed');
}

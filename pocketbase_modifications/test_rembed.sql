.load extensions/rembed.dylib sqlite3_rembed_init
SELECT rembed_version();
SELECT rembed_register_openai_client('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');
SELECT rembed('text-embedding-3-small', 'hello world');

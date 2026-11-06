.PHONY: migrate seed status rollback test check
migrate:
	python3 scripts/database.py migrate
seed:
	python3 scripts/database.py seed
status:
	python3 scripts/database.py status
rollback:
	python3 scripts/database.py rollback --allow-destructive
test:
	python3 scripts/test_database.py
check:
	python3 -m unittest discover -s tests -p 'test_*.py' -v
	git diff --check

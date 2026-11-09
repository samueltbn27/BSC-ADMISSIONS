.PHONY: migrate seed status rollback test check api-dev api-build api-test web-dev web-build
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
api-dev:
	cd backend && npm run dev
api-build:
	cd backend && npm run build
api-test:
	cd backend && npm test
web-dev:
	cd frontend && npm run dev
web-build:
	cd frontend && npm run build

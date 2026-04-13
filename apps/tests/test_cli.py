
import sys
import os
import pytest
from click.testing import CliRunner

# Voeg projectroot toe aan sys.path zodat cli.commands gevonden wordt
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cli.commands.cli import cli

def test_cli_load(monkeypatch):
    runner = CliRunner()
    result = runner.invoke(cli, ['load', '--file', 'ontology/legal technology.ttl'])
    assert result.exit_code == 0
    assert 'Succesvol geladen: ontology/legal technology.ttl' in result.output

def test_cli_extract(monkeypatch):
    runner = CliRunner()
    result = runner.invoke(cli, ['extract'])
    assert result.exit_code == 0
    assert 'Succesvol geëxporteerd naar export.ttl uit GraphDB repository' in result.output

def test_cli_clear(monkeypatch):
    runner = CliRunner()
    # Simuleer bevestiging met 'y' (yes)
    result = runner.invoke(cli, ['clear'], input='y\n')
    assert result.exit_code == 0
    assert 'GraphDB repository' in result.output

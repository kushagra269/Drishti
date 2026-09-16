from anpr.kafka.acl import AccessControl, AccessDenied


def test_acl_allows_configured_principal():
    acl = AccessControl(
        {
            "acl": [
                {
                    "principal": "ingestion-service",
                    "topics": ["anpr.frames.raw"],
                    "operations": ["produce"],
                }
            ]
        }
    )
    acl.assert_allowed("ingestion-service", "anpr.frames.raw", "produce")


def test_acl_denies_unknown_principal():
    acl = AccessControl({"acl": []})
    try:
        acl.assert_allowed("unknown", "anpr.records.final", "consume")
        raise AssertionError("expected deny")
    except AccessDenied:
        pass

# Common questions

**Do I have to do the stages in order?**
No. Get ready follows the Risk Management Framework, which is the order most
organisations find easiest. Do anything you can already do.

**A step will not tick.**
Steps with "The product checks this one itself" go green from your data. The
line underneath says what is missing. Steps only a person can confirm are
ticked by hand.

**Which baseline do we need?**
The one that matches your system's impact level: Low, Moderate or High. Work
it out from what losing confidentiality, integrity or availability would mean,
and write down how you decided. Low has 149 controls, Moderate 287, High 370.

**Can we change the baseline later?**
Yes. Applying a different one re-scopes the catalogue. Reasons you wrote
yourself are kept, and controls you took out yourself stay out. A control you
brought in by hand that is not in the new baseline goes back to not applicable,
so bring it in again.

**What are organisation-defined parameters?**
The blanks NIST leaves for you: how often, how long, which roles. 679 controls
have at least one. Fill them in on the control. Until you do, reports show
"[Assignment: …]".

**What does origination mean?**
Who actually operates the control. **System specific** means this system does
it. **Inherited** means a provider does it, such as your cloud host.
**Hybrid** means both. **Common** means it is done once for the whole
organisation.

**How fresh does evidence have to be?**
The product flags anything older than 90 days. Set a collected date on
everything.

**Does this get us an authorisation?**
No. It is where you build and keep the package. The decision belongs to your
authorising official.

**Why does the browser say "Not secure"?**
The server has no certificate the browser trusts. An administrator fixes it
for everyone under **Settings → HTTPS certificate**, with a certificate from
your IT team. It is free: you do not need to buy one.

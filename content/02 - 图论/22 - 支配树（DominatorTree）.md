# 支配树（DominatorTree）

有向图，点和 root 均使用 1..n 编号；root 是所有路线的起点。 idom[v] 是 v 最近的直接支配点；idom[root]=0，从 root 不可达的点也为 0。 dominates 将每点视为支配自身；不可达点除自身外不受任何点支配；加完边再 build。

构建 O((n+m)log n)，必经点查询 O(n) 时间；空间 O(n+m)。

```cpp
struct DominatorTree {
    int n, root;
    vector<pair<int, int>> edges;

    // 初始化节点数、根并清空边
    void init(int n_, int root_) {
        n = n_;
        root = root_;
        edges.clear();
    }
    // 加入一条有向边
    void addEdge(int u, int v) {
        edges.emplace_back(u, v);
    }

    // 路径压缩；仅处理 DFS 序编号
    static void compress(int v, vector<int> &ancestor, vector<int> &label,
                         const vector<int> &semi) {
        vector<int> pending;
        int vertex = v;
        while (ancestor[ancestor[vertex]] != 0) {
            pending.push_back(vertex);
            vertex = ancestor[vertex];
        }
        for (auto iterator = pending.rbegin(); iterator != pending.rend(); ++iterator) {
            vertex = *iterator;
            int parent = ancestor[vertex];
            if (semi[label[parent]] < semi[label[vertex]])
                label[vertex] = label[parent];
            ancestor[vertex] = ancestor[parent];
        }
    }
    // 返回 DFS 序编号 v 的半支配点候选
    static int EVAL(int v, vector<int> &ancestor, vector<int> &label, const vector<int> &semi) {
        if (ancestor[v] == 0)
            return v;
        compress(v, ancestor, label, semi);
        return label[v];
    }

    // 返回按原节点编号索引的直接支配点数组
    vector<int> build() const {
        vector<int> idom(n + 1, 0);
        if (n <= 0 || root < 1 || root > n)
            return idom;

        vector<vector<int>> adj(n + 1);
        for (auto [u, v] : edges)
            if (u >= 1 && u <= n && v >= 1 && v <= n)
                adj[u].push_back(v);

        vector<int> dfn(n + 1, 0), rev(n + 1, 0), par(n + 1, 0), it(n + 1, 0);
        int timer = 1;
        dfn[root] = 1;
        rev[1] = root;
        vector<int> stk{root};
        while (!stk.empty()) {
            int v = stk.back();
            if (it[v] < (int)adj[v].size()) {
                int w = adj[v][it[v]++];
                if (dfn[w] == 0) {
                    dfn[w] = ++timer;
                    rev[timer] = w;
                    par[timer] = dfn[v];
                    stk.push_back(w);
                }
            } else
                stk.pop_back();
        }
        int N = timer;

        // semi[i]=i 是算法不变量
        vector<int> semi(N + 1), label(N + 1), ancestor(N + 1, 0), dom(N + 1, 0);
        for (int i = 1; i <= N; ++i) {
            semi[i] = i;
            label[i] = i;
        }

        vector<vector<int>> pred(N + 1);
        for (auto [u, v] : edges)
            if (u >= 1 && u <= n && v >= 1 && v <= n && dfn[u] && dfn[v])
                pred[dfn[v]].push_back(dfn[u]);

        vector<vector<int>> bucket(N + 1);

        for (int i = N; i >= 2; --i) {
            int w = i;
            for (int v : pred[w]) {
                int u = EVAL(v, ancestor, label, semi);
                if (semi[u] < semi[w])
                    semi[w] = semi[u];
            }
            bucket[semi[w]].push_back(w);
            int p = par[i];
            ancestor[w] = p;
            for (int v : bucket[p]) {
                int u = EVAL(v, ancestor, label, semi);
                dom[v] = (semi[u] < semi[v]) ? u : p;
            }
            bucket[p].clear();
        }

        vector<int> idomDF(N + 1, 0);
        for (int i = 2; i <= N; ++i) {
            int w = i;
            if (dom[w] != semi[w])
                dom[w] = dom[dom[w]];
            idomDF[w] = dom[w];
        }

        for (int i = 2; i <= N; ++i)
            idom[rev[i]] = rev[idomDF[i]];
        return idom;
    }

    // 判断 u 是否支配 v；须传入 build 的结果
    static bool dominates(const vector<int> &idom, int root, int u, int v) {
        if (u == v)
            return true;
        int cur = v;
        while (cur != 0 && cur != u) {
            if (cur == root)
                return false;
            cur = idom[cur];
            if (cur == 0)
                return false;
        }
        return cur == u;
    }
};
```
